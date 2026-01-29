/**
 * Type Definitions
 */

export interface ChainConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    identityRegistry: string;
    reputationRegistry: string;
    validationRegistry: string;
}

export interface IndexerConfig {
    chains: ChainConfig[];
    pollIntervalMs: number;
    batchSize: number;
    startBlock?: number;
}

export interface ScanResult {
    url: string;
    tlsValid: boolean;
    tlsVersion?: string;
    tlsExpiry?: Date;
    dnsValid: boolean;
    httpStatus?: number;
    httpLatency?: number;
    trustScore: number;
    error?: string;
}

export interface TrustBadge {
    type: 'tls' | 'dns' | 'active' | 'x402' | 'verified';
    status: 'valid' | 'invalid' | 'unknown';
    label: string;
    details?: string;
}

// Avalanche chain configs
export const AVALANCHE_FUJI: Omit<ChainConfig, 'identityRegistry' | 'reputationRegistry' | 'validationRegistry'> = {
    chainId: 43113,
    name: 'Avalanche Fuji',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
};

export const AVALANCHE_MAINNET: Omit<ChainConfig, 'identityRegistry' | 'reputationRegistry' | 'validationRegistry'> = {
    chainId: 43114,
    name: 'Avalanche C-Chain',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
};
