// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./VotingContract.sol";

/**
 * @title ElectionFactory
 * @dev Deploys and tracks VotingContract instances.
 */
contract ElectionFactory is Ownable {
    address[] public deployedElections;

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new election contract
     */
    function createElection(
        string memory _title,
        uint256 _startTime,
        uint256 _endTime,
        string[] memory _candidateNames,
        string[] memory _candidateDescriptions,
        address _voterRegistryAddress
    ) external onlyOwner returns (address) {
        // We do not store _title in the contract to save gas, it will be mapped via DB
        VotingContract newElection = new VotingContract(
            _startTime,
            _endTime,
            _candidateNames,
            _candidateDescriptions,
            _voterRegistryAddress
        );
        
        // Transfer ownership of the new election to the factory's owner
        newElection.transferOwnership(msg.sender);
        
        deployedElections.push(address(newElection));
        return address(newElection);
    }

    /**
     * @dev Get all deployed election addresses
     */
    function getElections() external view returns (address[] memory) {
        return deployedElections;
    }
}
