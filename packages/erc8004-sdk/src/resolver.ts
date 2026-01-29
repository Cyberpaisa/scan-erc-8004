/**
 * URI Resolver - Handles ipfs://, ar://, data:, https://
 */

import type { AgentURI } from './schemas/agentUri.js';
import { parseAgentURI } from './schemas/agentUri.js';

// Default gateways
const DEFAULT_IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
const DEFAULT_ARWEAVE_GATEWAY = 'https://arweave.net/';

export interface ResolverConfig {
    ipfsGateway?: string;
    arweaveGateway?: string;
    timeout?: number;
}

/**
 * Resolve any URI scheme to a fetchable HTTPS URL
 */
export function resolveURI(uri: string, config: ResolverConfig = {}): string {
    const {
        ipfsGateway = DEFAULT_IPFS_GATEWAY,
        arweaveGateway = DEFAULT_ARWEAVE_GATEWAY,
    } = config;

    // Already HTTPS
    if (uri.startsWith('https://') || uri.startsWith('http://')) {
        return uri;
    }

    // IPFS
    if (uri.startsWith('ipfs://')) {
        const cid = uri.replace('ipfs://', '');
        return `${ipfsGateway}${cid}`;
    }

    // Arweave
    if (uri.startsWith('ar://')) {
        const txId = uri.replace('ar://', '');
        return `${arweaveGateway}${txId}`;
    }

    // Data URI - return as-is, will be handled separately
    if (uri.startsWith('data:')) {
        return uri;
    }

    // Unknown scheme, return as-is
    return uri;
}

/**
 * Check if URI is a data URI
 */
export function isDataURI(uri: string): boolean {
    return uri.startsWith('data:');
}

/**
 * Parse base64-encoded data URI
 * Supports: data:application/json;base64,...
 */
export function parseDataURI(uri: string): unknown {
    if (!isDataURI(uri)) {
        throw new Error('Not a data URI');
    }

    // Parse data URI format: data:[mediatype][;base64],data
    const match = uri.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
    if (!match) {
        throw new Error('Invalid data URI format');
    }

    const [, mediaType, isBase64, data] = match;

    let decoded: string;
    if (isBase64) {
        // Base64 decode
        decoded = Buffer.from(data!, 'base64').toString('utf-8');
    } else {
        // URL decode
        decoded = decodeURIComponent(data!);
    }

    // Parse as JSON if mediatype indicates JSON
    if (mediaType?.includes('json')) {
        return JSON.parse(decoded);
    }

    return decoded;
}

/**
 * Fetch and parse AgentURI metadata from any URI scheme
 */
export async function fetchAgentMetadata(
    uri: string,
    config: ResolverConfig = {}
): Promise<AgentURI> {
    const timeout = config.timeout ?? 30000;

    // Handle data URI directly
    if (isDataURI(uri)) {
        const data = parseDataURI(uri);
        return parseAgentURI(data);
    }

    // Resolve to HTTPS URL
    const url = resolveURI(uri, config);

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'ERC8004-Scanner/1.0',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();
        return parseAgentURI(json);
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Safe fetch that returns null on error
 */
export async function safeFetchAgentMetadata(
    uri: string,
    config: ResolverConfig = {}
): Promise<AgentURI | null> {
    try {
        return await fetchAgentMetadata(uri, config);
    } catch {
        return null;
    }
}

/**
 * Batch fetch multiple URIs
 */
export async function batchFetchAgentMetadata(
    uris: string[],
    config: ResolverConfig = {}
): Promise<Map<string, AgentURI | null>> {
    const results = new Map<string, AgentURI | null>();

    await Promise.all(
        uris.map(async (uri) => {
            const metadata = await safeFetchAgentMetadata(uri, config);
            results.set(uri, metadata);
        })
    );

    return results;
}
