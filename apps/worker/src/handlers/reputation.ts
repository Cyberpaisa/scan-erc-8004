/**
 * Reputation Registry Event Handlers
 * Handles: NewFeedback, FeedbackRevoked, ResponseAppended
 */

import { type Log, decodeEventLog } from 'viem';
import { db } from '@scanner/db';
import { ReputationRegistryABI } from '@scanner/erc8004-sdk';

interface NewFeedbackArgs {
    agentId: bigint;
    clientAddress: `0x${string}`;
    feedbackIndex: bigint;
    score: number;
    indexedTag1: string;
    tag1: string;
    tag2: string;
    endpoint: string;
    feedbackURI: string;
    feedbackHash: `0x${string}`;
}

interface FeedbackRevokedArgs {
    agentId: bigint;
    clientAddress: `0x${string}`;
    feedbackIndex: bigint;
}

interface ResponseAppendedArgs {
    agentId: bigint;
    clientAddress: `0x${string}`;
    feedbackIndex: bigint;
    responder: `0x${string}`;
    responseURI: string;
    responseHash: `0x${string}`;
}

export async function handleReputationEvents(
    logs: Log[],
    chainId: number,
    registryAddress: string
): Promise<void> {
    for (const log of logs) {
        try {
            const decoded = decodeEventLog({
                abi: ReputationRegistryABI,
                data: log.data,
                topics: log.topics,
            });

            switch (decoded.eventName) {
                case 'NewFeedback':
                    await handleNewFeedback(
                        decoded.args as unknown as NewFeedbackArgs,
                        log
                    );
                    break;
                case 'FeedbackRevoked':
                    await handleFeedbackRevoked(
                        decoded.args as unknown as FeedbackRevokedArgs
                    );
                    break;
                case 'ResponseAppended':
                    await handleResponseAppended(
                        decoded.args as unknown as ResponseAppendedArgs,
                        log
                    );
                    break;
            }
        } catch (error) {
            console.error('Error processing reputation event:', error);
        }
    }
}

async function handleNewFeedback(
    args: NewFeedbackArgs,
    log: Log
): Promise<void> {
    console.log(`  → NewFeedback: Agent #${args.agentId} score=${args.score} from ${args.clientAddress.slice(0, 10)}...`);

    // Check if agent exists
    const agent = await db.agent.findUnique({
        where: { agentId: args.agentId },
    });

    if (!agent) {
        console.log(`    ⚠ Agent #${args.agentId} not found, skipping feedback`);
        return;
    }

    await db.feedback.upsert({
        where: {
            agentId_clientAddress_feedbackIndex: {
                agentId: args.agentId,
                clientAddress: args.clientAddress,
                feedbackIndex: args.feedbackIndex,
            },
        },
        create: {
            agentId: args.agentId,
            clientAddress: args.clientAddress,
            feedbackIndex: args.feedbackIndex,
            score: args.score,
            tag1: args.tag1 || null,
            tag2: args.tag2 || null,
            targetEndpoint: args.endpoint || null,
            feedbackURI: args.feedbackURI || null,
            feedbackHash: args.feedbackHash || null,
            createdBlock: log.blockNumber ?? 0n,
            createdTx: log.transactionHash ?? '',
        },
        update: {
            score: args.score,
            tag1: args.tag1 || null,
            tag2: args.tag2 || null,
        },
    });

    console.log(`    ✓ Feedback recorded: score=${args.score}`);
}

async function handleFeedbackRevoked(
    args: FeedbackRevokedArgs
): Promise<void> {
    console.log(`  → FeedbackRevoked: Agent #${args.agentId} index=${args.feedbackIndex}`);

    try {
        await db.feedback.update({
            where: {
                agentId_clientAddress_feedbackIndex: {
                    agentId: args.agentId,
                    clientAddress: args.clientAddress,
                    feedbackIndex: args.feedbackIndex,
                },
            },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
            },
        });

        console.log(`    ✓ Feedback revoked`);
    } catch {
        console.log(`    ⚠ Feedback not found, skipping revocation`);
    }
}

async function handleResponseAppended(
    args: ResponseAppendedArgs,
    log: Log
): Promise<void> {
    console.log(`  → ResponseAppended: Agent #${args.agentId} from ${args.responder.slice(0, 10)}...`);

    // Find the feedback
    const feedback = await db.feedback.findUnique({
        where: {
            agentId_clientAddress_feedbackIndex: {
                agentId: args.agentId,
                clientAddress: args.clientAddress,
                feedbackIndex: args.feedbackIndex,
            },
        },
    });

    if (!feedback) {
        console.log(`    ⚠ Feedback not found, skipping response`);
        return;
    }

    await db.feedbackResponse.create({
        data: {
            feedbackId: feedback.id,
            responderAddress: args.responder,
            responseURI: args.responseURI || null,
            responseHash: args.responseHash || null,
            createdBlock: log.blockNumber ?? 0n,
            createdTx: log.transactionHash ?? '',
        },
    });

    console.log(`    ✓ Response appended`);
}
