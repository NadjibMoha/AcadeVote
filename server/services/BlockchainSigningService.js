const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

class BlockchainSigningService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.HARDHAT_RPC_URL || 'http://127.0.0.1:8545');
    this.wallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, this.provider);
    
    this.factoryAbi = [
      "function createElection(string, uint256, uint256, string[], string[], address) returns (address)"
    ];
    this.registryAbi = ["function bulkRegisterVoters(uint256[])"];
    this.votingAbi = ["function castVote(uint256, uint256)", "function publishResults()"];
  }

  async deployElection(title, startTime, endTime, candidateNames, candidateDescs, voterRegistryAddress) {
    const factory = new ethers.Contract(process.env.ELECTION_FACTORY_ADDRESS, this.factoryAbi, this.wallet);
    // In ethers v6, staticCall simulates the tx and returns the result
    const contractAddress = await factory.createElection.staticCall(title, startTime, endTime, candidateNames, candidateDescs, voterRegistryAddress);
    
    const tx = await factory.createElection(title, startTime, endTime, candidateNames, candidateDescs, voterRegistryAddress);
    await tx.wait();
    
    return contractAddress;
  }
  
  async registerVoterTokens(voterRegistryAddress, voterTokens) {
    const registry = new ethers.Contract(voterRegistryAddress, this.registryAbi, this.wallet);
    const tx = await registry.bulkRegisterVoters(voterTokens);
    await tx.wait();
    return tx.hash;
  }
  
  async castVote(contractAddress, voterToken, candidateId) {
    const votingContract = new ethers.Contract(contractAddress, this.votingAbi, this.wallet);
    const tx = await votingContract.castVote(voterToken, candidateId);
    await tx.wait();
    return tx.hash;
  }
  
  async publishResults(contractAddress) {
    const votingContract = new ethers.Contract(contractAddress, this.votingAbi, this.wallet);
    const tx = await votingContract.publishResults();
    await tx.wait();
    return tx.hash;
  }
}

module.exports = new BlockchainSigningService();
