// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title ValidationRegistry
 * @notice ERC-8004 Validation Registry - Agent work validation
 */
contract ValidationRegistry {
    
    // ==============================================
    // EVENTS
    // ==============================================
    
    event ValidationRequest(
        address indexed validatorAddress,
        uint256 indexed agentId,
        string requestURI,
        bytes32 indexed requestHash
    );
    
    event ValidationResponse(
        address indexed validatorAddress,
        uint256 indexed agentId,
        bytes32 indexed requestHash,
        uint8 response,
        string responseURI,
        bytes32 responseHash,
        string tag
    );

    // ==============================================
    // STRUCTS
    // ==============================================
    
    struct ValidationRecord {
        address validatorAddress;
        uint256 agentId;
        uint8 response;
        uint256 lastUpdate;
        string tag;
    }

    // ==============================================
    // STATE
    // ==============================================
    
    IERC721 public immutable identityRegistry;
    
    // requestHash => ValidationRecord
    mapping(bytes32 => ValidationRecord) private _validations;

    // ==============================================
    // CONSTRUCTOR
    // ==============================================
    
    constructor(address _identityRegistry) {
        identityRegistry = IERC721(_identityRegistry);
    }

    // ==============================================
    // VALIDATION REQUEST
    // ==============================================
    
    /**
     * @notice Request validation from a validator
     * @param validatorAddress Address of the validator contract
     * @param agentId The agent ID requesting validation
     * @param requestURI URI pointing to validation request data
     * @param requestHash Hash of request data (commitment)
     */
    function validationRequest(
        address validatorAddress,
        uint256 agentId,
        string calldata requestURI,
        bytes32 requestHash
    ) external {
        require(_isAgentOwnerOrOperator(agentId, msg.sender), "Not agent owner/operator");
        require(_validations[requestHash].validatorAddress == address(0), "Request already exists");
        
        _validations[requestHash] = ValidationRecord({
            validatorAddress: validatorAddress,
            agentId: agentId,
            response: 0,
            lastUpdate: 0,
            tag: ""
        });
        
        emit ValidationRequest(validatorAddress, agentId, requestURI, requestHash);
    }

    // ==============================================
    // VALIDATION RESPONSE
    // ==============================================
    
    /**
     * @notice Respond to a validation request
     * @param requestHash The request hash to respond to
     * @param response Response score (0-100)
     * @param responseURI URI to response evidence
     * @param responseHash Hash of response content
     * @param tag Optional categorization tag
     */
    function validationResponse(
        bytes32 requestHash,
        uint8 response,
        string calldata responseURI,
        bytes32 responseHash,
        string calldata tag
    ) external {
        ValidationRecord storage record = _validations[requestHash];
        require(record.validatorAddress == msg.sender, "Not the designated validator");
        require(response <= 100, "Response must be 0-100");
        
        record.response = response;
        record.lastUpdate = block.timestamp;
        record.tag = tag;
        
        emit ValidationResponse(
            msg.sender,
            record.agentId,
            requestHash,
            response,
            responseURI,
            responseHash,
            tag
        );
    }

    // ==============================================
    // VIEW FUNCTIONS
    // ==============================================
    
    /**
     * @notice Get validation record
     */
    function getValidation(bytes32 requestHash) external view returns (
        address validatorAddress,
        uint256 agentId,
        uint8 response,
        uint256 lastUpdate,
        string memory tag
    ) {
        ValidationRecord storage record = _validations[requestHash];
        return (
            record.validatorAddress,
            record.agentId,
            record.response,
            record.lastUpdate,
            record.tag
        );
    }
    
    /**
     * @notice Get the identity registry address
     */
    function getIdentityRegistry() external view returns (address) {
        return address(identityRegistry);
    }

    // ==============================================
    // INTERNAL
    // ==============================================
    
    function _isAgentOwnerOrOperator(uint256 agentId, address account) internal view returns (bool) {
        try identityRegistry.ownerOf(agentId) returns (address owner) {
            if (account == owner) return true;
            try identityRegistry.isApprovedForAll(owner, account) returns (bool approved) {
                if (approved) return true;
            } catch {}
            try identityRegistry.getApproved(agentId) returns (address approved) {
                if (approved == account) return true;
            } catch {}
            return false;
        } catch {
            return false;
        }
    }
}
