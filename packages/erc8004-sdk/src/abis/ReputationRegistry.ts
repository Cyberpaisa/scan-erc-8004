/**
 * ERC-8004 Reputation Registry ABI
 * Events: NewFeedback, FeedbackRevoked, ResponseAppended
 */

export const ReputationRegistryABI = [
    // Events
    {
        type: 'event',
        name: 'NewFeedback',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'clientAddress', type: 'address', indexed: true },
            { name: 'feedbackIndex', type: 'uint64', indexed: false },
            { name: 'score', type: 'uint8', indexed: false },
            { name: 'indexedTag1', type: 'string', indexed: true },
            { name: 'tag1', type: 'string', indexed: false },
            { name: 'tag2', type: 'string', indexed: false },
            { name: 'endpoint', type: 'string', indexed: false },
            { name: 'feedbackURI', type: 'string', indexed: false },
            { name: 'feedbackHash', type: 'bytes32', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'FeedbackRevoked',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'clientAddress', type: 'address', indexed: true },
            { name: 'feedbackIndex', type: 'uint64', indexed: true },
        ],
    },
    {
        type: 'event',
        name: 'ResponseAppended',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'clientAddress', type: 'address', indexed: true },
            { name: 'feedbackIndex', type: 'uint64', indexed: true },
            { name: 'responder', type: 'address', indexed: false },
            { name: 'responseURI', type: 'string', indexed: false },
            { name: 'responseHash', type: 'bytes32', indexed: false },
        ],
    },
    // Functions
    {
        type: 'function',
        name: 'giveFeedback',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'score', type: 'uint8' },
            { name: 'tag1', type: 'string' },
            { name: 'tag2', type: 'string' },
            { name: 'endpoint', type: 'string' },
            { name: 'feedbackURI', type: 'string' },
            { name: 'feedbackHash', type: 'bytes32' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'revokeFeedback',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'feedbackIndex', type: 'uint64' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'appendResponse',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'clientAddress', type: 'address' },
            { name: 'feedbackIndex', type: 'uint64' },
            { name: 'responseURI', type: 'string' },
            { name: 'responseHash', type: 'bytes32' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'getFeedback',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'clientAddress', type: 'address' },
            { name: 'feedbackIndex', type: 'uint64' },
        ],
        outputs: [
            { name: 'score', type: 'uint8' },
            { name: 'tag1', type: 'string' },
            { name: 'tag2', type: 'string' },
            { name: 'endpoint', type: 'string' },
            { name: 'isRevoked', type: 'bool' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getIdentityRegistry',
        inputs: [],
        outputs: [{ name: 'identityRegistry', type: 'address' }],
        stateMutability: 'view',
    },
] as const;
