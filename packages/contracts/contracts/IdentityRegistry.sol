// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title IdentityRegistry
 * @notice ERC-8004 Identity Registry - Agent registration and metadata
 * @dev ERC-721 with URI storage for agent registration
 */
contract IdentityRegistry is ERC721URIStorage, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ==============================================
    // EVENTS
    // ==============================================
    
    event Registered(
        uint256 indexed agentId,
        string agentURI,
        address indexed owner
    );
    
    event URIUpdated(
        uint256 indexed agentId,
        string newURI,
        address indexed updatedBy
    );
    
    event MetadataSet(
        uint256 indexed agentId,
        string indexed indexedMetadataKey,
        string metadataKey,
        bytes metadataValue
    );

    // ==============================================
    // STATE
    // ==============================================
    
    uint256 private _nextAgentId;
    
    // agentId => metadataKey => metadataValue
    mapping(uint256 => mapping(string => bytes)) private _metadata;
    
    // agentId => agentWallet
    mapping(uint256 => address) private _agentWallets;
    
    // Reserved metadata keys
    string public constant AGENT_WALLET_KEY = "agentWallet";

    // ==============================================
    // CONSTRUCTOR
    // ==============================================
    
    constructor() ERC721("ERC8004 Agent", "AGENT") Ownable(msg.sender) {
        _nextAgentId = 1; // Start from 1
    }

    // ==============================================
    // REGISTRATION
    // ==============================================
    
    /**
     * @notice Register a new agent with URI and optional metadata
     * @param agentURI The URI pointing to agent metadata JSON
     * @return agentId The newly minted agent ID
     */
    function register(string memory agentURI) external returns (uint256) {
        uint256 agentId = _nextAgentId++;
        
        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);
        
        // Set initial agentWallet to owner
        _agentWallets[agentId] = msg.sender;
        
        emit Registered(agentId, agentURI, msg.sender);
        
        return agentId;
    }
    
    /**
     * @notice Register with metadata entries
     * @param agentURI The URI pointing to agent metadata JSON
     * @param metadataKeys Array of metadata keys
     * @param metadataValues Array of metadata values
     * @return agentId The newly minted agent ID
     */
    function registerWithMetadata(
        string memory agentURI,
        string[] memory metadataKeys,
        bytes[] memory metadataValues
    ) external returns (uint256) {
        require(metadataKeys.length == metadataValues.length, "Length mismatch");
        
        uint256 agentId = _nextAgentId++;
        
        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);
        
        // Set initial agentWallet to owner
        _agentWallets[agentId] = msg.sender;
        
        emit Registered(agentId, agentURI, msg.sender);
        
        // Set metadata
        for (uint256 i = 0; i < metadataKeys.length; i++) {
            require(
                keccak256(bytes(metadataKeys[i])) != keccak256(bytes(AGENT_WALLET_KEY)),
                "Cannot set agentWallet via metadata"
            );
            _metadata[agentId][metadataKeys[i]] = metadataValues[i];
            emit MetadataSet(agentId, metadataKeys[i], metadataKeys[i], metadataValues[i]);
        }
        
        return agentId;
    }

    // ==============================================
    // URI MANAGEMENT
    // ==============================================
    
    /**
     * @notice Update agent URI
     * @param agentId The agent ID
     * @param newURI The new URI
     */
    function setAgentURI(uint256 agentId, string memory newURI) external {
        require(_isApprovedOrOwner(msg.sender, agentId), "Not authorized");
        _setTokenURI(agentId, newURI);
        emit URIUpdated(agentId, newURI, msg.sender);
    }

    // ==============================================
    // METADATA MANAGEMENT
    // ==============================================
    
    /**
     * @notice Set on-chain metadata
     * @param agentId The agent ID
     * @param metadataKey The metadata key
     * @param metadataValue The metadata value
     */
    function setMetadata(
        uint256 agentId,
        string memory metadataKey,
        bytes memory metadataValue
    ) external {
        require(_isApprovedOrOwner(msg.sender, agentId), "Not authorized");
        require(
            keccak256(bytes(metadataKey)) != keccak256(bytes(AGENT_WALLET_KEY)),
            "Use setAgentWallet for wallet"
        );
        
        _metadata[agentId][metadataKey] = metadataValue;
        emit MetadataSet(agentId, metadataKey, metadataKey, metadataValue);
    }
    
    /**
     * @notice Get on-chain metadata
     * @param agentId The agent ID
     * @param metadataKey The metadata key
     * @return The metadata value
     */
    function getMetadata(
        uint256 agentId,
        string memory metadataKey
    ) external view returns (bytes memory) {
        return _metadata[agentId][metadataKey];
    }

    // ==============================================
    // AGENT WALLET
    // ==============================================
    
    /**
     * @notice Get agent wallet address
     * @param agentId The agent ID
     * @return The wallet address
     */
    function getAgentWallet(uint256 agentId) external view returns (address) {
        return _agentWallets[agentId];
    }
    
    /**
     * @notice Set agent wallet with signature verification
     * @param agentId The agent ID
     * @param newWallet The new wallet address
     * @param deadline Signature deadline
     * @param signature The EIP-712 signature from newWallet
     */
    function setAgentWallet(
        uint256 agentId,
        address newWallet,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(_isApprovedOrOwner(msg.sender, agentId), "Not authorized");
        require(block.timestamp <= deadline, "Signature expired");
        
        // Verify signature from newWallet
        bytes32 message = keccak256(
            abi.encodePacked(agentId, newWallet, deadline, block.chainid, address(this))
        );
        bytes32 ethSignedMessage = message.toEthSignedMessageHash();
        address signer = ethSignedMessage.recover(signature);
        
        require(signer == newWallet, "Invalid signature");
        
        _agentWallets[agentId] = newWallet;
        
        emit MetadataSet(agentId, AGENT_WALLET_KEY, AGENT_WALLET_KEY, abi.encodePacked(newWallet));
    }

    // ==============================================
    // VIEW FUNCTIONS
    // ==============================================
    
    /**
     * @notice Get total number of registered agents
     */
    function totalSupply() external view returns (uint256) {
        return _nextAgentId - 1;
    }

    // ==============================================
    // INTERNAL
    // ==============================================
    
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || 
                isApprovedForAll(owner, spender) || 
                getApproved(tokenId) == spender);
    }
    
    /**
     * @notice Reset agentWallet on transfer
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = super._update(to, tokenId, auth);
        
        // Reset agentWallet on transfer
        if (from != address(0) && to != address(0)) {
            _agentWallets[tokenId] = address(0);
        }
        
        return from;
    }
}
