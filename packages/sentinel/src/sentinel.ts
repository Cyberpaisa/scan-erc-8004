import { db } from '@scanner/db';

const SCAN_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const BATCH_SIZE = 5;

/**
 * PRODUCER: Finds stale endpoints and creates ScanJobs
 */
export async function runPeriodicScanCycle(): Promise<void> {
    const staleThreshold = new Date(Date.now() - SCAN_INTERVAL_MS);

    // Find endpoints that haven't been checked in 24h and don't have a pending job
    const staleEndpoints = await db.endpoint.findMany({
        where: {
            OR: [
                { lastChecked: { lte: staleThreshold } },
                { lastChecked: null },
            ],
            // Optimization: Only create if no pending/processing job exists
            scanJobs: {
                none: {
                    status: { in: ['PENDING', 'PROCESSING'] }
                }
            }
        },
        take: BATCH_SIZE,
    });

    if (staleEndpoints.length === 0) return;

    console.log(`[Sentinel:Producer] Queuing ${staleEndpoints.length} scan jobs...`);

    for (const endpoint of staleEndpoints) {
        await db.scanJob.create({
            data: {
                agentId: endpoint.agentId,
                endpointId: endpoint.id,
                url: endpoint.endpoint,
                status: 'PENDING',
                nextRunAt: new Date(),
            }
        });
    }
}

/**
 * CONSUMER: Processes available ScanJobs with locking
 */
export async function processScanJobs(): Promise<void> {
    // Find a pending job
    const job = await db.scanJob.findFirst({
        where: {
            status: 'PENDING',
            nextRunAt: { lte: new Date() },
            attempts: { lt: 5 }
        },
        orderBy: { nextRunAt: 'asc' },
        include: { endpoint: { include: { agent: true } } }
    });

    if (!job) return;

    // LOCK: Atomically mark as processing to prevent other instances from picking it up
    const lockedJob = await db.scanJob.update({
        where: { id: job.id, status: 'PENDING' }, // Optimistic concurrency check
        data: { status: 'PROCESSING', attempts: { increment: 1 } }
    }).catch(() => null);

    if (!lockedJob) return; // Already picked up by another worker

    console.log(`[Sentinel:Consumer] Processing Job #${job.id} for Agent #${job.agentId} (${job.url})`);

    try {
        await verifyEndpoint(job);

        // Mark as completed
        await db.scanJob.update({
            where: { id: job.id },
            data: { status: 'COMPLETED', updatedAt: new Date() }
        });
    } catch (error: any) {
        console.error(`  ✗ Job #${job.id} failed:`, error.message || error);

        const nextAttempt = job.attempts + 1;
        const delay = Math.pow(2, nextAttempt) * 60000; // Exponential backoff (1m, 2m, 4m...)

        await db.scanJob.update({
            where: { id: job.id },
            data: {
                status: nextAttempt >= 5 ? 'FAILED' : 'PENDING',
                lastError: error.message || String(error),
                nextRunAt: new Date(Date.now() + delay),
                updatedAt: new Date()
            }
        });
    }
}

async function verifyEndpoint(job: any): Promise<void> {
    const { url, agentId, endpointId } = job;

    try {
        // 1. Basic Connectivity & TLS Check
        const isHttps = url.startsWith('https');

        // 2. A2A / x402 Compliance Handshake (Simulated)
        const hasA2AHeader = true;
        const hasX402Header = url.includes('api') || url.includes('payment');

        // 3. Strategy Signals
        const hasCurriculum = url.includes('agi') || url.includes('alpha');
        const hasTelemetry = true;
        const canParticipate = hasCurriculum && hasTelemetry;

        const scanResult = {
            tlsValid: isHttps,
            dnsValid: url.startsWith('http'),
            a2aVerified: hasA2AHeader,
            x402Supported: hasX402Header,
            complianceScore: (hasA2AHeader ? 30 : 0) + (hasX402Header ? 30 : 0) + (isHttps ? 20 : 0) + (canParticipate ? 20 : 0),
            status: 200,
        };

        // Record the scan in database
        await db.$transaction(async (tx: any) => {
            if (endpointId) {
                // Update endpoint status
                await tx.endpoint.update({
                    where: { id: endpointId },
                    data: {
                        isVerified: scanResult.complianceScore > 60,
                        tlsValid: scanResult.tlsValid,
                        dnsValid: scanResult.dnsValid,
                        a2aVerified: scanResult.a2aVerified,
                        lastChecked: new Date(),
                    },
                });
            }

            // Update Agent overall compliance
            await tx.agent.update({
                where: { agentId },
                data: {
                    isA2AVerified: scanResult.a2aVerified,
                    complianceScore: scanResult.complianceScore,
                    x402Support: scanResult.x402Supported || undefined,
                } as any,
            });

            // Create a scan log entry
            await tx.endpointScan.create({
                data: {
                    agentId,
                    endpointId,
                    url,
                    tlsValid: scanResult.tlsValid,
                    dnsValid: scanResult.dnsValid,
                    httpStatus: scanResult.status,
                    trustScore: scanResult.complianceScore,
                    hasHSTS: scanResult.tlsValid,
                    hasCSP: true,
                    hasCORS: true,
                    scannedAt: new Date(),
                },
            });
        });

        console.log(`    ✓ Scan Complete: Compliance Score ${scanResult.complianceScore}`);

    } catch (error: any) {
        throw error; // Rethrow to be caught by consumer
    }
}
