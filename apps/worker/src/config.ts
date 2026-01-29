/**
 * Worker Configuration
 */

import 'dotenv/config';

export interface Config {
    // Database
    databaseUrl: string;

    // Chain
    rpcUrl: string;
    chainId: number;
    startBlock: number;

    // Contract addresses
    identityRegistryAddress: string;
    reputationRegistryAddress: string;
    validationRegistryAddress: string;

    // Indexer settings
    pollIntervalMs: number;
    batchSize: number;

    // Gateways
    ipfsGateway: string;
    arweaveGateway: string;
}

function required(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required env var: ${key}`);
    }
    return value;
}

function optional(key: string, defaultValue: string): string {
    return process.env[key] ?? defaultValue;
}

export function loadConfig(): Config {
    return {
        databaseUrl: required('DATABASE_URL'),
        rpcUrl: required('RPC_URL'),
        chainId: parseInt(optional('CHAIN_ID', '43113'), 10),
        startBlock: parseInt(optional('START_BLOCK', '0'), 10),

        identityRegistryAddress: required('IDENTITY_REGISTRY_ADDRESS'),
        reputationRegistryAddress: required('REPUTATION_REGISTRY_ADDRESS'),
        validationRegistryAddress: required('VALIDATION_REGISTRY_ADDRESS'),

        pollIntervalMs: parseInt(optional('POLL_INTERVAL_MS', '5000'), 10),
        batchSize: parseInt(optional('BATCH_SIZE', '1000'), 10),

        ipfsGateway: optional('IPFS_GATEWAY', 'https://ipfs.io/ipfs/'),
        arweaveGateway: optional('ARWEAVE_GATEWAY', 'https://arweave.net/'),
    };
}

export const config = loadConfig();
