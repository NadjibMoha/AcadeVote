// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
        string memory title,
        uint256 startTime,
        uint256 endTime,
        string[] memory candidateNames,
        string[] memory candidateDescriptions,
        address voterRegistryAddress
    ) external onlyOwner returns (address) {
        // We do not store title in the contract to save gas, it will be mapped via DB
        VotingContract newElection = new VotingContract(
            startTime,
            endTime,
            candidateNames,
            candidateDescriptions,
            voterRegistryAddress
        );
        
        deployedElections.push(address(newElection));
        
        // Transfer ownership of the new election to the factory's owner
        newElection.transferOwnership(msg.sender);
        
        return address(newElection);
    }

    /**
     * @dev Get all deployed election addresses
     */
    function getElections() external view returns (address[] memory) {
        return deployedElections;
    }
}
