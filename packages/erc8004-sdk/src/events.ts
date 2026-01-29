/**
 * Event Decoding Utilities
 */

import { decodeEventLog, type Log } from 'viem';
import { IdentityRegistryABI } from './abis/IdentityRegistry.js';
import { ReputationRegistryABI } from './abis/ReputationRegistry.js';
import { ValidationRegistryABI } from './abis/ValidationRegistry.js';

// ==============================================
// EVENT NAMES
// ==============================================

export const IDENTITY_EVENTS = {
    Registered: 'Registered',
    URIUpdated: 'URIUpdated',
    MetadataSet: 'MetadataSet',
    Transfer: 'Transfer',
} as const;

export const REPUTATION_EVENTS = {
    NewFeedback: 'NewFeedback',
    FeedbackRevoked: 'FeedbackRevoked',
    ResponseAppended: 'ResponseAppended',
} as const;

export const VALIDATION_EVENTS = {
    ValidationRequest: 'ValidationRequest',
    ValidationResponse: 'ValidationResponse',
} as const;

// ==============================================
// DECODED EVENT TYPES
// ==============================================

export interface DecodedEvent<T = unknown> {
    eventName: string;
    args: T;
    address: string;
    blockNumber: bigint;
    transactionHash: string;
    logIndex: number;
}

export interface RegisteredArgs {
    agentId: bigint;
    agentURI: string;
    owner: string;
}

export interface URIUpdatedArgs {
    agentId: bigint;
    newURI: string;
    updatedBy: string;
}

export interface MetadataSetArgs {
    agentId: bigint;
    indexedMetadataKey: string;
    metadataKey: string;
    metadataValue: string; // hex bytes
}

export interface NewFeedbackArgs {
    agentId: bigint;
    clientAddress: string;
    feedbackIndex: bigint;
    score: number;
    indexedTag1: string;
    tag1: string;
    tag2: string;
    endpoint: string;
    feedbackURI: string;
    feedbackHash: string;
}

export interface FeedbackRevokedArgs {
    agentId: bigint;
    clientAddress: string;
    feedbackIndex: bigint;
}

export interface ValidationRequestArgs {
    validatorAddress: string;
    agentId: bigint;
    requestURI: string;
    requestHash: string;
}

export interface ValidationResponseArgs {
    validatorAddress: string;
    agentId: bigint;
    requestHash: string;
    response: number;
    responseURI: string;
    responseHash: string;
    tag: string;
}

// ==============================================
// DECODE FUNCTIONS
// ==============================================

/**
 * Decode an Identity Registry event log
 */
export function decodeIdentityEvent(log: Log): DecodedEvent | null {
    try {
        const decoded = decodeEventLog({
            abi: IdentityRegistryABI,
            data: log.data,
            topics: log.topics,
        });

        return {
            eventName: decoded.eventName,
            args: decoded.args,
            address: log.address,
            blockNumber: log.blockNumber ?? 0n,
            transactionHash: log.transactionHash ?? '',
            logIndex: log.logIndex ?? 0,
        };
    } catch {
        return null;
    }
}

/**
 * Decode a Reputation Registry event log
 */
export function decodeReputationEvent(log: Log): DecodedEvent | null {
    try {
        const decoded = decodeEventLog({
            abi: ReputationRegistryABI,
            data: log.data,
            topics: log.topics,
        });

        return {
            eventName: decoded.eventName,
            args: decoded.args,
            address: log.address,
            blockNumber: log.blockNumber ?? 0n,
            transactionHash: log.transactionHash ?? '',
            logIndex: log.logIndex ?? 0,
        };
    } catch {
        return null;
    }
}

/**
 * Decode a Validation Registry event log
 */
export function decodeValidationEvent(log: Log): DecodedEvent | null {
    try {
        const decoded = decodeEventLog({
            abi: ValidationRegistryABI,
            data: log.data,
            topics: log.topics,
        });

        return {
            eventName: decoded.eventName,
            args: decoded.args,
            address: log.address,
            blockNumber: log.blockNumber ?? 0n,
            transactionHash: log.transactionHash ?? '',
            logIndex: log.logIndex ?? 0,
        };
    } catch {
        return null;
    }
}

/**
 * Get event signature topics for filtering
 */
export function getEventTopics() {
    return {
        identity: {
            Registered: '0x' + 'Registered(uint256,string,address)', // Will be computed
            URIUpdated: '0x' + 'URIUpdated(uint256,string,address)',
            MetadataSet: '0x' + 'MetadataSet(uint256,string,string,bytes)',
        },
        reputation: {
            NewFeedback: '0x' + 'NewFeedback(...)',
            FeedbackRevoked: '0x' + 'FeedbackRevoked(uint256,address,uint64)',
        },
        validation: {
            ValidationRequest: '0x' + 'ValidationRequest(address,uint256,string,bytes32)',
            ValidationResponse: '0x' + 'ValidationResponse(address,uint256,bytes32,uint8,string,bytes32,string)',
        },
    };
}
