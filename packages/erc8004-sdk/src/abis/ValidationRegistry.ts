/**
 * ERC-8004 Validation Registry ABI
 * Events: ValidationRequest, ValidationResponse
 */

export const ValidationRegistryABI = [
    // Events
    {
        type: 'event',
        name: 'ValidationRequest',
        inputs: [
            { name: 'validatorAddress', type: 'address', indexed: true },
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'requestURI', type: 'string', indexed: false },
            { name: 'requestHash', type: 'bytes32', indexed: true },
        ],
    },
    {
        type: 'event',
        name: 'ValidationResponse',
        inputs: [
            { name: 'validatorAddress', type: 'address', indexed: true },
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'requestHash', type: 'bytes32', indexed: true },
            { name: 'response', type: 'uint8', indexed: false },
            { name: 'responseURI', type: 'string', indexed: false },
            { name: 'responseHash', type: 'bytes32', indexed: false },
            { name: 'tag', type: 'string', indexed: false },
        ],
    },
    // Functions
    {
        type: 'function',
        name: 'validationRequest',
        inputs: [
            { name: 'validatorAddress', type: 'address' },
            { name: 'agentId', type: 'uint256' },
            { name: 'requestURI', type: 'string' },
            { name: 'requestHash', type: 'bytes32' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'validationResponse',
        inputs: [
            { name: 'requestHash', type: 'bytes32' },
            { name: 'response', type: 'uint8' },
            { name: 'responseURI', type: 'string' },
            { name: 'responseHash', type: 'bytes32' },
            { name: 'tag', type: 'string' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'getValidation',
        inputs: [{ name: 'requestHash', type: 'bytes32' }],
        outputs: [
            { name: 'validatorAddress', type: 'address' },
            { name: 'agentId', type: 'uint256' },
            { name: 'response', type: 'uint8' },
            { name: 'lastUpdate', type: 'uint256' },
            { name: 'tag', type: 'string' },
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
