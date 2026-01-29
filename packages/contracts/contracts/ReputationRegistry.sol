// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title ReputationRegistry
 * @notice ERC-8004 Reputation Registry - Feedback and ratings for agents
 */
contract ReputationRegistry {
    
    // ==============================================
    // EVENTS
    // ==============================================
    
    event NewFeedback(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        uint8 score,
        string indexed indexedTag1,
        string tag1,
        string tag2,
        string endpoint,
        string feedbackURI,
        bytes32 feedbackHash
    );
    
    event FeedbackRevoked(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 indexed feedbackIndex
    );
    
    event ResponseAppended(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 indexed feedbackIndex,
        address responder,
        string responseURI,
        bytes32 responseHash
    );

    // ==============================================
    // STRUCTS
    // ==============================================
    
    struct Feedback {
        uint8 score;
        string tag1;
        string tag2;
        string endpoint;
        bool isRevoked;
    }

    // ==============================================
    // STATE
    // ==============================================
    
    IERC721 public immutable identityRegistry;
    
    // agentId => clientAddress => feedbackIndex => Feedback
    mapping(uint256 => mapping(address => mapping(uint64 => Feedback))) private _feedback;
    
    // agentId => clientAddress => next feedbackIndex
    mapping(uint256 => mapping(address => uint64)) private _feedbackCount;

    // ==============================================
    // CONSTRUCTOR
    // ==============================================
    
    constructor(address _identityRegistry) {
        identityRegistry = IERC721(_identityRegistry);
    }

    // ==============================================
    // FEEDBACK
    // ==============================================
    
    /**
     * @notice Give feedback to an agent
     * @param agentId The agent ID
     * @param score Score from 0-100
     * @param tag1 Optional tag 1
     * @param tag2 Optional tag 2
     * @param endpoint Optional target endpoint
     * @param feedbackURI Optional URI to off-chain feedback details
     * @param feedbackHash Optional hash of feedbackURI content
     */
    function giveFeedback(
        uint256 agentId,
        uint8 score,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external {
        require(score <= 100, "Score must be 0-100");
        require(_agentExists(agentId), "Agent does not exist");
        
        uint64 feedbackIndex = _feedbackCount[agentId][msg.sender]++;
        
        _feedback[agentId][msg.sender][feedbackIndex] = Feedback({
            score: score,
            tag1: tag1,
            tag2: tag2,
            endpoint: endpoint,
            isRevoked: false
        });
        
        emit NewFeedback(
            agentId,
            msg.sender,
            feedbackIndex,
            score,
            tag1,
            tag1,
            tag2,
            endpoint,
            feedbackURI,
            feedbackHash
        );
    }
    
    /**
     * @notice Revoke previously given feedback
     * @param agentId The agent ID
     * @param feedbackIndex The feedback index to revoke
     */
    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external {
        Feedback storage fb = _feedback[agentId][msg.sender][feedbackIndex];
        require(!fb.isRevoked, "Already revoked");
        require(fb.score > 0 || bytes(fb.tag1).length > 0, "Feedback does not exist");
        
        fb.isRevoked = true;
        
        emit FeedbackRevoked(agentId, msg.sender, feedbackIndex);
    }
    
    /**
     * @notice Append a response to feedback
     * @param agentId The agent ID
     * @param clientAddress The original feedback giver
     * @param feedbackIndex The feedback index
     * @param responseURI URI to response content
     * @param responseHash Hash of response content
     */
    function appendResponse(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex,
        string calldata responseURI,
        bytes32 responseHash
    ) external {
        Feedback storage fb = _feedback[agentId][clientAddress][feedbackIndex];
        require(!fb.isRevoked, "Feedback is revoked");
        require(fb.score > 0 || bytes(fb.tag1).length > 0, "Feedback does not exist");
        
        emit ResponseAppended(
            agentId,
            clientAddress,
            feedbackIndex,
            msg.sender,
            responseURI,
            responseHash
        );
    }

    // ==============================================
    // VIEW FUNCTIONS
    // ==============================================
    
    /**
     * @notice Get feedback details
     */
    function getFeedback(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex
    ) external view returns (
        uint8 score,
        string memory tag1,
        string memory tag2,
        string memory endpoint,
        bool isRevoked
    ) {
        Feedback storage fb = _feedback[agentId][clientAddress][feedbackIndex];
        return (fb.score, fb.tag1, fb.tag2, fb.endpoint, fb.isRevoked);
    }
    
    /**
     * @notice Get feedback count for a client on an agent
     */
    function getFeedbackCount(
        uint256 agentId,
        address clientAddress
    ) external view returns (uint64) {
        return _feedbackCount[agentId][clientAddress];
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
    
    function _agentExists(uint256 agentId) internal view returns (bool) {
        try identityRegistry.ownerOf(agentId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }
}
