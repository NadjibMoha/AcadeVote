// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./VoterRegistry.sol";

/**
 * @title VotingContract
 * @dev One contract instance per election.
 */
contract VotingContract is Ownable, ReentrancyGuard {
    struct Candidate {
        string name;
        string description;
        uint256 voteCount;
    }

    Candidate[] public candidates;
    mapping(uint256 => bool) public hasVoted; // keyed by voterToken
    VoterRegistry public voterRegistry;
    uint256 public startTime;
    uint256 public endTime;
    bool public resultsPublished;

    event VoteCast(uint256 indexed voterToken, uint256 indexed candidateId, uint256 timestamp);
    event ResultsPublished(uint256 timestamp);

    modifier electionActive() {
        require(block.timestamp >= startTime, "Election has not started");
        require(block.timestamp <= endTime, "Election has ended");
        _;
    }

    constructor(
        uint256 _startTime,
        uint256 _endTime,
        string[] memory _candidateNames,
        string[] memory _candidateDescriptions,
        address _voterRegistryAddress
    ) Ownable(msg.sender) {
        require(_startTime < _endTime, "End time must be after start time");
        require(_candidateNames.length == _candidateDescriptions.length, "Mismatched candidate arrays");
        require(_candidateNames.length >= 2, "Minimum 2 candidates required");

        startTime = _startTime;
        endTime = _endTime;
        voterRegistry = VoterRegistry(_voterRegistryAddress);

        for (uint i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate({
                name: _candidateNames[i],
                description: _candidateDescriptions[i],
                voteCount: 0
            }));
        }
    }

    /**
     * @dev Cast a vote for a candidate
     * @param _voterToken The pseudonymous uint256 token of the voter
     * @param _candidateId The index of the candidate
     */
    function castVote(uint256 _voterToken, uint256 _candidateId) external onlyOwner nonReentrant electionActive {
        require(voterRegistry.isRegistered(_voterToken), "Voter not registered");
        require(!hasVoted[_voterToken], "Voter has already voted");
        require(_candidateId < candidates.length, "Invalid candidate ID");

        hasVoted[_voterToken] = true;
        candidates[_candidateId].voteCount += 1;

        emit VoteCast(_voterToken, _candidateId, block.timestamp);
    }

    /**
     * @dev Publish election results
     */
    function publishResults() external onlyOwner {
        require(block.timestamp > endTime, "Election has not ended yet");
        require(!resultsPublished, "Results already published");
        
        resultsPublished = true;
        emit ResultsPublished(block.timestamp);
    }

    /**
     * @dev Get election results (only if published)
     */
    function getResults() external view returns (
        string[] memory names,
        string[] memory descriptions,
        uint256[] memory voteCounts
    ) {
        require(resultsPublished, "Results not yet published");
        
        uint256 length = candidates.length;
        names = new string[](length);
        descriptions = new string[](length);
        voteCounts = new uint256[](length);
        
        for (uint i = 0; i < length; i++) {
            names[i] = candidates[i].name;
            descriptions[i] = candidates[i].description;
            voteCounts[i] = candidates[i].voteCount;
        }
    }
}
