/**
 * Metadata Hydration Loop
 * Processes pending MetadataTasks in the background
 */

import { db, TaskStatus } from '@scanner/db';
import { safeFetchAgentMetadata, calculateAgentHash, getServices } from '@scanner/erc8004-sdk';
import { config } from './config.js';

const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 60000; // 1 minute

export async function runHydrationCycle(): Promise<void> {
    // Find pending or failed tasks that are ready to run
    const tasks = await db.metadataTask.findMany({
        where: {
            status: { in: ['PENDING', 'FAILED'] as TaskStatus[] },
            attempts: { lt: MAX_ATTEMPTS },
            nextRunAt: { lte: new Date() },
        },
        take: BATCH_SIZE,
        orderBy: { updatedAt: 'asc' },
    });

    if (tasks.length === 0) return;

    console.log(`[Hydration] Processing ${tasks.length} tasks...`);

    for (const task of tasks) {
        await processTask(task);
    }
}

async function processTask(task: any): Promise<void> {
    const { id, agentId, uri, attempts } = task;

    try {
        // Mark as processing
        await db.metadataTask.update({
            where: { id },
            data: { status: 'PROCESSING' as TaskStatus },
        });

        const metadata = await safeFetchAgentMetadata(uri, {
            ipfsGateway: config.ipfsGateway,
            arweaveGateway: config.arweaveGateway,
            timeout: 30000,
        });

        if (!metadata) {
            throw new Error('Failed to fetch metadata (null response)');
        }

        // Calculate hash and services
        const agentHash = calculateAgentHash(metadata);
        const services = getServices(metadata);

        // Update agent and endpoints in one transaction
        await db.$transaction(async (tx) => {
            // Update agent
            await tx.agent.update({
                where: { agentId },
                data: {
                    name: metadata.name,
                    description: metadata.description,
                    image: metadata.image,
                    active: metadata.active ?? false,
                    x402Support: metadata.x402Support ?? false,
                    supportedTrust: metadata.supportedTrust ?? [],
                    agentHash,
                    lastHydratedAt: new Date(),
                },
            });

            // Refresh endpoints
            await tx.endpoint.deleteMany({ where: { agentId } });

            for (const service of services) {
                await tx.endpoint.create({
                    data: {
                        agentId,
                        name: service.name,
                        endpoint: service.endpoint,
                        version: service.version,
                        capabilities: service.capabilities ? { data: service.capabilities } : undefined,
                        skills: service.skills ? { data: service.skills } : undefined,
                        domains: service.domains ? { data: service.domains } : undefined,
                    },
                });
            }
        });

        // Mark task as completed
        await db.metadataTask.update({
            where: { id },
            data: { status: 'COMPLETED' as TaskStatus },
        });

        console.log(`    ✓ Task #${id}: Hydrated Agent #${agentId}`);

    } catch (error: any) {
        const nextAttempt = attempts + 1;
        const delay = Math.pow(2, nextAttempt) * RETRY_DELAY_MS; // Exponential backoff

        console.error(`    ✗ Task #${id}: Error (Attempt ${nextAttempt}):`, error.message || error);

        await db.metadataTask.update({
            where: { id },
            data: {
                status: nextAttempt >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING' as TaskStatus,
                attempts: nextAttempt,
                lastError: error.message || String(error),
                nextRunAt: new Date(Date.now() + delay),
            },
        });
    }
}
