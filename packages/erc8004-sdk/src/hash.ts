/**
 * Hash Utilities - keccak256 for agent metadata integrity
 */

import { keccak256, toBytes, toHex } from 'viem';
import type { AgentURI } from './schemas/agentUri.js';

/**
 * Canonicalize JSON for consistent hashing
 * - Sorts object keys alphabetically
 * - Removes undefined values
 * - No whitespace
 */
export function canonicalizeJSON(obj: unknown): string {
    return JSON.stringify(obj, (_, value) => {
        if (value === undefined) return undefined;
        if (value === null) return null;
        if (typeof value !== 'object' || Array.isArray(value)) return value;

        // Sort object keys
        const sorted: Record<string, unknown> = {};
        for (const key of Object.keys(value).sort()) {
            sorted[key] = value[key];
        }
        return sorted;
    });
}

/**
 * Calculate keccak256 hash of agent metadata
 * Uses canonical JSON representation for consistency
 */
export function calculateAgentHash(metadata: AgentURI): string {
    const canonical = canonicalizeJSON(metadata);
    const bytes = toBytes(canonical);
    return keccak256(bytes);
}

/**
 * Calculate hash of arbitrary data
 */
export function hashData(data: string | Uint8Array): string {
    const bytes = typeof data === 'string' ? toBytes(data) : data;
    return keccak256(bytes);
}

/**
 * Verify metadata hash matches expected
 */
export function verifyAgentHash(metadata: AgentURI, expectedHash: string): boolean {
    const actualHash = calculateAgentHash(metadata);
    return actualHash.toLowerCase() === expectedHash.toLowerCase();
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
    return toHex(bytes);
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
    return toBytes(hex);
}
