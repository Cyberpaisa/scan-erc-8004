import { type Log, decodeEventLog } from 'viem';
import { db } from '@scanner/db';
import { IdentityRegistryABI } from '@scanner/erc8004-sdk';

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

    // Create async hydration task
    if (args.agentURI) {
        await db.metadataTask.create({
            data: {
                agentId: agent.agentId,
                uri: args.agentURI,
                type: 'AGENT_METADATA',
                status: 'PENDING',
            },
        });
        console.log(`    → Created hydration task for Agent #${agent.agentId}`);
    }
}

async function handleURIUpdated(
    args: URIUpdatedArgs,
    _log: Log
): Promise<void> {
    console.log(`  → URIUpdated: Agent #${args.agentId} → ${args.newURI.slice(0, 50)}...`);

    await db.agent.update({
        where: { agentId: args.agentId },
        data: {
            agentURI: args.newURI,
            lastIndexedAt: new Date(),
        },
    });

    // Create async hydration task for updated URI
    await db.metadataTask.create({
        data: {
            agentId: args.agentId,
            uri: args.newURI,
            type: 'AGENT_METADATA',
            status: 'PENDING',
        },
    });
    console.log(`    → Created hydration task (update) for Agent #${args.agentId}`);
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
