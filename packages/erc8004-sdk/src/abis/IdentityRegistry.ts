/**
 * ERC-8004 Identity Registry ABI
 * Events: Registered, URIUpdated, MetadataSet
 */

export const IdentityRegistryABI = [
    // Events
    {
        type: 'event',
        name: 'Registered',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'agentURI', type: 'string', indexed: false },
            { name: 'owner', type: 'address', indexed: true },
        ],
    },
    {
        type: 'event',
        name: 'URIUpdated',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'newURI', type: 'string', indexed: false },
            { name: 'updatedBy', type: 'address', indexed: true },
        ],
    },
    {
        type: 'event',
        name: 'MetadataSet',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'indexedMetadataKey', type: 'string', indexed: true },
            { name: 'metadataKey', type: 'string', indexed: false },
            { name: 'metadataValue', type: 'bytes', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'Transfer',
        inputs: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'tokenId', type: 'uint256', indexed: true },
        ],
    },
    // Functions
    {
        type: 'function',
        name: 'register',
        inputs: [{ name: 'agentURI', type: 'string' }],
        outputs: [{ name: 'agentId', type: 'uint256' }],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'setAgentURI',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'newURI', type: 'string' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'setMetadata',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'metadataKey', type: 'string' },
            { name: 'metadataValue', type: 'bytes' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'getMetadata',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'metadataKey', type: 'string' },
        ],
        outputs: [{ name: '', type: 'bytes' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'tokenURI',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'ownerOf',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'totalSupply',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
] as const;
