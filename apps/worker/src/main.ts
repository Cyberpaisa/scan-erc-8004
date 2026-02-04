/**
 * Indexer Worker - Main Entry Point
 * Polls blockchain for ERC-8004 events and processes them
 */

import { createPublicClient, http, type Log, type Address } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { db } from '@scanner/db';
import { config } from './config.js';
import { handleIdentityEvents } from './handlers/identity.js';
import { handleReputationEvents } from './handlers/reputation.js';
import { handleValidationEvents } from './handlers/validation.js';
import { runHydrationCycle } from './hydration.js';
import { runPeriodicScanCycle, processScanJobs } from '@scanner/sentinel';
import { processFinancialMetrics } from './handlers/payment.js';

// ==============================================
// SETUP
// ==============================================

const client = createPublicClient({
    chain: avalancheFuji,
    transport: http(config.rpcUrl, {
        retryCount: 5,
        retryDelay: 2000,
    }),
});

const REGISTRIES = {
    identity: config.identityRegistryAddress as Address,
    reputation: config.reputationRegistryAddress as Address,
    validation: config.validationRegistryAddress as Address,
};

// ==============================================
// CURSOR MANAGEMENT
// ==============================================

async function getCursor(registry: string): Promise<bigint> {
    const cursor = await db.indexerCursor.findUnique({
        where: {
            chainId_registry: {
                chainId: config.chainId,
                registry,
            },
        },
    });
    return cursor ? BigInt(cursor.lastBlock) : BigInt(config.startBlock);
}

async function updateCursor(registry: string, block: bigint, tx?: string): Promise<void> {
    await db.indexerCursor.upsert({
        where: {
            chainId_registry: {
                chainId: config.chainId,
                registry,
            },
        },
        create: {
            chainId: config.chainId,
            registry,
            lastBlock: block,
            lastTx: tx,
        },
        update: {
            lastBlock: block,
            lastTx: tx,
        },
    });
}

// ==============================================
// LOG FETCHING
// ==============================================

async function fetchLogs(
    address: Address,
    fromBlock: bigint,
    toBlock: bigint
): Promise<Log[]> {
    try {
        const logs = await client.getLogs({
            address,
            fromBlock,
            toBlock,
        });
        return logs;
    } catch (error) {
        console.error(`Error fetching logs from ${fromBlock} to ${toBlock}:`, error);
        return [];
    }
}

// ==============================================
// INDEXER LOOP
// ==============================================

async function indexRegistry(
    name: string,
    address: Address,
    handler: (logs: Log[], _chainId: number, _registryAddress: string) => Promise<void>
): Promise<void> {
    const fromBlock = await getCursor(name);
    const currentBlock = await client.getBlockNumber();

    // Calculate toBlock with batch size limit
    const maxToBlock = fromBlock + BigInt(config.batchSize);
    const toBlock = maxToBlock < currentBlock ? maxToBlock : currentBlock;

    if (fromBlock >= toBlock) {
        return; // Already up to date
    }

    console.log(`[${name}] Indexing blocks ${fromBlock} to ${toBlock}...`);

    const logs = await fetchLogs(address, fromBlock, toBlock);

    if (logs.length > 0) {
        console.log(`[${name}] Processing ${logs.length} events...`);
        await handler(logs, config.chainId, address);
    }

    await updateCursor(name, toBlock);
}

async function runIndexerCycle(): Promise<void> {
    // Index Identity Registry
    await indexRegistry(
        'identity',
        REGISTRIES.identity,
        handleIdentityEvents
    );

    // Index Reputation Registry
    await indexRegistry(
        'reputation',
        REGISTRIES.reputation,
        handleReputationEvents
    );

    // Index Validation Registry
    await indexRegistry(
        'validation',
        REGISTRIES.validation,
        handleValidationEvents
    );
}

// ==============================================
// MAIN
// ==============================================

async function main(): Promise<void> {
    console.log('=====================================');
    console.log('ERC-8004 Agent Scanner Worker');
    console.log('=====================================');
    console.log('Chain ID:', config.chainId);
    console.log('RPC URL:', config.rpcUrl);
    console.log('Identity Registry:', config.identityRegistryAddress);
    console.log('Reputation Registry:', config.reputationRegistryAddress);
    console.log('Validation Registry:', config.validationRegistryAddress);
    console.log('Poll Interval:', config.pollIntervalMs, 'ms');
    console.log('=====================================');
    console.log('');

    // Initial run
    console.log('Starting indexer...');

    // Polling loop
    while (true) {
        try {
            console.log('\n--- Starting Indexer Cycle ---');
            await runIndexerCycle();

            console.log('\n--- Starting Hydration Cycle ---');
            await runHydrationCycle();

            console.log('\n--- Starting Sentinel Cycle ---');
            await runPeriodicScanCycle();
            await processScanJobs();

            console.log('\n--- Starting Financial Metrics Cycle ---'); // Added log
            await processFinancialMetrics(); // Added call
        } catch (error) {
            console.error('Worker cycle error:', error);
        }

        await new Promise(resolve => setTimeout(resolve, config.pollIntervalMs));
    }
}

// Handle shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await db.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down...');
    await db.$disconnect();
    process.exit(0);
});

main().catch(console.error);
