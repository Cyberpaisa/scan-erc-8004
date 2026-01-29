/**
 * Validation Registry Event Handlers
 * Handles: ValidationRequest, ValidationResponse
 */

import { type Log, decodeEventLog } from 'viem';
import { db, ValidationStatus } from '@scanner/db';
import { ValidationRegistryABI } from '@scanner/erc8004-sdk';

interface ValidationRequestArgs {
    validatorAddress: `0x${string}`;
    agentId: bigint;
    requestURI: string;
    requestHash: `0x${string}`;
}

interface ValidationResponseArgs {
    validatorAddress: `0x${string}`;
    agentId: bigint;
    requestHash: `0x${string}`;
    response: number;
    responseURI: string;
    responseHash: `0x${string}`;
    tag: string;
}

export async function handleValidationEvents(
    logs: Log[],
    chainId: number,
    registryAddress: string
): Promise<void> {
    for (const log of logs) {
        try {
            const decoded = decodeEventLog({
                abi: ValidationRegistryABI,
                data: log.data,
                topics: log.topics,
            });

            switch (decoded.eventName) {
                case 'ValidationRequest':
                    await handleValidationRequest(
                        decoded.args as unknown as ValidationRequestArgs,
                        log
                    );
                    break;
                case 'ValidationResponse':
                    await handleValidationResponse(
                        decoded.args as unknown as ValidationResponseArgs,
                        log
                    );
                    break;
            }
        } catch (error) {
            console.error('Error processing validation event:', error);
        }
    }
}

async function handleValidationRequest(
    args: ValidationRequestArgs,
    log: Log
): Promise<void> {
    console.log(`  → ValidationRequest: Agent #${args.agentId} → ${args.validatorAddress.slice(0, 10)}...`);

    // Check if agent exists
    const agent = await db.agent.findUnique({
        where: { agentId: args.agentId },
    });

    if (!agent) {
        console.log(`    ⚠ Agent #${args.agentId} not found, skipping validation request`);
        return;
    }

    await db.validation.upsert({
        where: { requestHash: args.requestHash },
        create: {
            agentId: args.agentId,
            validatorAddress: args.validatorAddress,
            requestURI: args.requestURI || null,
            requestHash: args.requestHash,
            status: ValidationStatus.PENDING,
            requestedBlock: log.blockNumber ?? 0n,
            requestedTx: log.transactionHash ?? '',
        },
        update: {
            // Update if re-submitted
            requestURI: args.requestURI || null,
        },
    });

    console.log(`    ✓ Validation request recorded`);
}

async function handleValidationResponse(
    args: ValidationResponseArgs,
    log: Log
): Promise<void> {
    console.log(`  → ValidationResponse: hash=${args.requestHash.slice(0, 18)}... response=${args.response}`);

    // Find the validation request
    const validation = await db.validation.findUnique({
        where: { requestHash: args.requestHash },
    });

    if (!validation) {
        console.log(`    ⚠ Validation request not found, creating new record`);

        // Create a new validation record with the response
        await db.validation.create({
            data: {
                agentId: args.agentId,
                validatorAddress: args.validatorAddress,
                requestHash: args.requestHash,
                response: args.response,
                responseURI: args.responseURI || null,
                responseHash: args.responseHash || null,
                responseTag: args.tag || null,
                status: determineStatus(args.response),
                lastUpdate: new Date(),
                requestedBlock: log.blockNumber ?? 0n,
                requestedTx: log.transactionHash ?? '',
                respondedBlock: log.blockNumber ?? null,
                respondedTx: log.transactionHash ?? null,
            },
        });
    } else {
        // Update existing validation
        await db.validation.update({
            where: { requestHash: args.requestHash },
            data: {
                response: args.response,
                responseURI: args.responseURI || null,
                responseHash: args.responseHash || null,
                responseTag: args.tag || null,
                status: determineStatus(args.response),
                lastUpdate: new Date(),
                respondedBlock: log.blockNumber ?? null,
                respondedTx: log.transactionHash ?? null,
            },
        });
    }

    console.log(`    ✓ Validation response recorded: status=${determineStatus(args.response)}`);
}

function determineStatus(response: number): ValidationStatus {
    if (response === 0) return ValidationStatus.FAILED;
    if (response === 100) return ValidationStatus.PASSED;
    if (response > 0 && response < 100) return ValidationStatus.PARTIAL;
    return ValidationStatus.PENDING;
}
