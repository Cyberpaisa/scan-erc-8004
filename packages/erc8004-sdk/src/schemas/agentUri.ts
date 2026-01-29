/**
 * AgentURI Schema - Zod validation for ERC-8004 Agent Metadata
 * Supports both "services" (Jan 2026+) and legacy "endpoints"
 */

import { z } from 'zod';

// ==============================================
// SERVICE/ENDPOINT SCHEMA
// ==============================================

/**
 * Base service object schema
 */
export const ServiceSchema = z.object({
    name: z.string().min(1),
    endpoint: z.string().min(1),
    version: z.string().optional(),
    // MCP-specific
    capabilities: z.array(z.string()).optional(),
    // OASF-specific
    skills: z.array(z.string()).optional(),
    domains: z.array(z.string()).optional(),
});

export type Service = z.infer<typeof ServiceSchema>;

// ==============================================
// REGISTRATION SCHEMA
// ==============================================

/**
 * Registration linking to on-chain identity
 */
export const RegistrationSchema = z.object({
    agentId: z.union([z.number(), z.null()]).optional(), // null for pending registration
    agentRegistry: z.string().min(1), // CAIP-10 format: eip155:chainId:address
});

export type Registration = z.infer<typeof RegistrationSchema>;

// ==============================================
// FULL AGENT URI SCHEMA
// ==============================================

/**
 * Complete AgentURI metadata schema
 * Per ERC-8004 and Agent Metadata Profile
 */
export const AgentURISchema = z.object({
    // SHOULD fields (official spec)
    type: z.string().default('https://eips.ethereum.org/EIPS/eip-8004#registration-v1'),
    name: z.string().min(1),
    description: z.string().optional(),
    image: z.string().optional(),

    // Services (Jan 2026+) - preferred
    services: z.array(ServiceSchema).optional(),

    // Legacy endpoints - still supported
    endpoints: z.array(ServiceSchema).optional(),

    // Optional fields (MAY)
    x402Support: z.boolean().optional(),
    active: z.boolean().optional(),
    registrations: z.array(RegistrationSchema).optional(),
    supportedTrust: z.array(z.string()).optional(),
    updatedAt: z.number().optional(), // Unix timestamp
});

export type AgentURI = z.infer<typeof AgentURISchema>;

// ==============================================
// HELPER FUNCTIONS
// ==============================================

/**
 * Get services from AgentURI metadata
 * Handles both "services" and legacy "endpoints" field
 */
export function getServices(metadata: AgentURI): Service[] {
    // services takes precedence over endpoints
    return metadata.services ?? metadata.endpoints ?? [];
}

/**
 * Parse and validate AgentURI JSON
 */
export function parseAgentURI(json: unknown): AgentURI {
    return AgentURISchema.parse(json);
}

/**
 * Safe parse that returns null on failure
 */
export function safeParseAgentURI(json: unknown): AgentURI | null {
    const result = AgentURISchema.safeParse(json);
    return result.success ? result.data : null;
}

/**
 * Validate CAIP-10 format for agentRegistry
 * Format: namespace:chainId:contractAddress
 * Example: eip155:43113:0x742...
 */
export function isValidCAIP10(value: string): boolean {
    const pattern = /^[a-z0-9-]+:\d+:0x[a-fA-F0-9]{40}$/;
    return pattern.test(value);
}

/**
 * Parse CAIP-10 string into components
 */
export function parseCAIP10(value: string): { namespace: string; chainId: number; address: string } | null {
    const match = value.match(/^([a-z0-9-]+):(\d+):(0x[a-fA-F0-9]{40})$/);
    if (!match) return null;

    const [, namespace, chainIdStr, address] = match;
    return {
        namespace: namespace!,
        chainId: parseInt(chainIdStr!, 10),
        address: address!,
    };
}

/**
 * Build CAIP-10 string
 */
export function buildCAIP10(namespace: string, chainId: number, address: string): string {
    return `${namespace}:${chainId}:${address}`;
}

// ==============================================
// KNOWN TRUST MODELS
// ==============================================

export const KNOWN_TRUST_MODELS = [
    'reputation',
    'crypto-economic',
    'tee-attestation',
    'social-graph',
] as const;

export type TrustModel = typeof KNOWN_TRUST_MODELS[number];

// ==============================================
// KNOWN ENDPOINT TYPES
// ==============================================

export const KNOWN_ENDPOINT_TYPES = [
    'MCP',
    'A2A',
    'OASF',
    'web',
    'ENS',
    'DID',
    'agentWallet',
    'email',
] as const;

export type EndpointType = typeof KNOWN_ENDPOINT_TYPES[number];
