// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VoterRegistry
 * @dev Manages voter token registration. Only callable by the contract owner (the backend server wallet).
 */
contract VoterRegistry is Ownable {
    mapping(uint256 => bool) private registeredVoters;

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Register a single voter token
     * @param voterToken The pseudonymous uint256 token
     */
    function registerVoter(uint256 voterToken) external onlyOwner {
        require(!registeredVoters[voterToken], "Voter already registered");
        registeredVoters[voterToken] = true;
    }

    /**
     * @dev Check if a voter token is registered
     * @param voterToken The pseudonymous uint256 token
     */
    function isRegistered(uint256 voterToken) external view returns (bool) {
        return registeredVoters[voterToken];
    }

    /**
     * @dev Bulk register voter tokens
     * @param voterTokens Array of pseudonymous uint256 tokens
     */
    function bulkRegisterVoters(uint256[] calldata voterTokens) external onlyOwner {
        for (uint256 i = 0; i < voterTokens.length; i++) {
            if (!registeredVoters[voterTokens[i]]) {
                registeredVoters[voterTokens[i]] = true;
            }
        }
    }
}
