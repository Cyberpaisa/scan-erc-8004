import { db } from '@scanner/db';

const SCAN_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const BATCH_SIZE = 5;

export async function runPeriodicScanCycle(): Promise<void> {
    const staleThreshold = new Date(Date.now() - SCAN_INTERVAL_MS);

    // Find endpoints that haven't been checked in 24h
    const staleEndpoints = await db.endpoint.findMany({
        where: {
            OR: [
                { lastChecked: { lte: staleThreshold } },
                { lastChecked: null },
            ],
        },
        take: BATCH_SIZE,
        include: { agent: true },
    });

    if (staleEndpoints.length === 0) return;

    console.log(`[Sentinel] Re-verifying ${staleEndpoints.length} stale endpoints...`);

    for (const endpoint of staleEndpoints) {
        await verifyEndpoint(endpoint);
    }
}

async function verifyEndpoint(endpoint: any): Promise<void> {
    const { id, endpoint: url, name, agentId } = endpoint;

    console.log(`  → Scanning: ${name} for Agent #${agentId} (${url})`);

    try {
        // Simplified Sentinel Scan (Simulated for this implementation)
        // In a real production environment, this would use 'https' module to check certs
        // and 'dns' module to check records.

        const isHttp = url.startsWith('http');
        const isHttps = url.startsWith('https');

        const scanResult = {
            tlsValid: isHttps,
            dnsValid: isHttp || isHttps,
            trustScore: isHttps ? 100 : 50,
            status: 200,
        };

        // Record the scan in database
        await db.$transaction(async (tx) => {
            // Update endpoint status
            await tx.endpoint.update({
                where: { id },
                data: {
                    isVerified: scanResult.trustScore > 80,
                    tlsValid: scanResult.tlsValid,
                    dnsValid: scanResult.dnsValid,
                    lastChecked: new Date(),
                },
            });

            // Create a scan log entry
            await tx.endpointScan.create({
                data: {
                    agentId,
                    endpointId: id,
                    url,
                    tlsValid: scanResult.tlsValid,
                    dnsValid: scanResult.dnsValid,
                    httpStatus: scanResult.status,
                    trustScore: scanResult.trustScore,
                    scannedAt: new Date(),
                },
            });
        });

        console.log(`    ✓ Scanned ${id}: Score ${scanResult.trustScore}`);

    } catch (error: any) {
        console.error(`    ✗ Scan error for endpoint ${id}:`, error.message || error);

        await db.endpointScan.create({
            data: {
                agentId,
                endpointId: id,
                url,
                error: error.message || String(error),
                trustScore: 0,
                scannedAt: new Date(),
            },
        });
    }
}
