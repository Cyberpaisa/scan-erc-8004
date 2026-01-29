/**
 * Identity Registry Event Handlers
 * Handles: Registered, URIUpdated, MetadataSet
 */

import { type Log, decodeEventLog } from 'viem';
import { db } from '@scanner/db';
import { IdentityRegistryABI, safeFetchAgentMetadata, calculateAgentHash, getServices } from '@scanner/erc8004-sdk';
import { config } from '../config.js';

interface RegisteredArgs {
    agentId: bigint;
    agentURI: string;
    owner: `0x${string}`;
}

interface URIUpdatedArgs {
    agentId: bigint;
    newURI: string;
    updatedBy: `0x${string}`;
}

interface MetadataSetArgs {
    agentId: bigint;
    indexedMetadataKey: string;
    metadataKey: string;
    metadataValue: `0x${string}`;
}

export async function handleIdentityEvents(
    logs: Log[],
    chainId: number,
    registryAddress: string
): Promise<void> {
    for (const log of logs) {
        try {
            const decoded = decodeEventLog({
                abi: IdentityRegistryABI,
                data: log.data,
                topics: log.topics,
            });

            switch (decoded.eventName) {
                case 'Registered':
                    await handleRegistered(
                        decoded.args as unknown as RegisteredArgs,
                        log,
                        chainId,
                        registryAddress
                    );
                    break;
                case 'URIUpdated':
                    await handleURIUpdated(
                        decoded.args as unknown as URIUpdatedArgs,
                        log
                    );
                    break;
                case 'MetadataSet':
                    await handleMetadataSet(
                        decoded.args as unknown as MetadataSetArgs,
                        log
                    );
                    break;
            }
        } catch (error) {
            console.error('Error processing identity event:', error);
        }
    }
}

async function handleRegistered(
    args: RegisteredArgs,
    log: Log,
    chainId: number,
    registryAddress: string
): Promise<void> {
    console.log(`  → Registered: Agent #${args.agentId} by ${args.owner}`);

    // Create agent record
    const agent = await db.agent.upsert({
        where: { agentId: args.agentId },
        create: {
            agentId: args.agentId,
            chainId,
            registryAddress,
            ownerAddress: args.owner,
            agentURI: args.agentURI,
            registeredBlock: log.blockNumber ?? 0n,
            registeredTx: log.transactionHash ?? '',
        },
        update: {
            ownerAddress: args.owner,
            agentURI: args.agentURI,
            lastIndexedAt: new Date(),
        },
    });

    // Hydrate metadata if URI exists
    if (args.agentURI) {
        await hydrateAgentMetadata(agent.agentId, args.agentURI);
    }
}

async function handleURIUpdated(
    args: URIUpdatedArgs,
    log: Log
): Promise<void> {
    console.log(`  → URIUpdated: Agent #${args.agentId} → ${args.newURI.slice(0, 50)}...`);

    await db.agent.update({
        where: { agentId: args.agentId },
        data: {
            agentURI: args.newURI,
            lastIndexedAt: new Date(),
        },
    });

    // Re-hydrate metadata
    await hydrateAgentMetadata(args.agentId, args.newURI);
}

async function handleMetadataSet(
    args: MetadataSetArgs,
    _log: Log
): Promise<void> {
    console.log(`  → MetadataSet: Agent #${args.agentId} key=${args.metadataKey}`);

    // Convert hex to bytes
    const valueBytes = Buffer.from(args.metadataValue.slice(2), 'hex');

    await db.agentMetadata.upsert({
        where: {
            agentId_metadataKey: {
                agentId: args.agentId,
                metadataKey: args.metadataKey,
            },
        },
        create: {
            agentId: args.agentId,
            metadataKey: args.metadataKey,
            metadataValue: valueBytes,
        },
        update: {
            metadataValue: valueBytes,
            updatedAt: new Date(),
        },
    });
}

// ==============================================
// METADATA HYDRATION
// ==============================================

async function hydrateAgentMetadata(agentId: bigint, uri: string): Promise<void> {
    try {
        const metadata = await safeFetchAgentMetadata(uri, {
            ipfsGateway: config.ipfsGateway,
            arweaveGateway: config.arweaveGateway,
            timeout: 30000,
        });

        if (!metadata) {
            console.log(`    ⚠ Failed to fetch metadata for Agent #${agentId}`);
            return;
        }

        // Calculate hash
        const agentHash = calculateAgentHash(metadata);

        // Get services (handles both services and legacy endpoints)
        const services = getServices(metadata);

        // Update agent with hydrated data
        await db.agent.update({
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

        // Delete old endpoints and create new ones
        await db.endpoint.deleteMany({ where: { agentId } });

        for (const service of services) {
            await db.endpoint.create({
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

        console.log(`    ✓ Hydrated Agent #${agentId}: "${metadata.name}" with ${services.length} endpoints`);

    } catch (error) {
        console.error(`    ✗ Hydration error for Agent #${agentId}:`, error);
    }
}
