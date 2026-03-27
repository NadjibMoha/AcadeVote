const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

class BlockchainReadService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.HARDHAT_RPC_URL || 'http://127.0.0.1:8545');
    this.registryAbi = ["function isRegistered(uint256) view returns (bool)"];
    this.votingAbi = [
      "function getResults() view returns (string[], string[], uint256[])",
      "function startTime() view returns (uint256)",
      "function endTime() view returns (uint256)",
      "function resultsPublished() view returns (bool)",
      "event VoteCast(uint256 indexed voterToken, uint256 indexed candidateId, uint256 timestamp)"
    ];
  }

  async getElectionResults(contractAddress) {
    const contract = new ethers.Contract(contractAddress, this.votingAbi, this.provider);
    const results = await contract.getResults();
    // results is [names, descriptions, voteCounts]
    const names = results[0];
    const descriptions = results[1];
    const voteCounts = results[2].map(vc => Number(vc));
    return { names, descriptions, voteCounts };
  }

  async getVoteTransactions(contractAddress) {
    const contract = new ethers.Contract(contractAddress, this.votingAbi, this.provider);
    const filter = contract.filters.VoteCast();
    const events = await contract.queryFilter(filter, 0, "latest");
    return events.map(e => ({
      voterToken: e.args[0].toString(),
      candidateId: Number(e.args[1]),
      timestamp: Number(e.args[2]),
      txHash: e.transactionHash
    }));
  }

  async isVoterRegistered(voterRegistryAddress, voterToken) {
    const registry = new ethers.Contract(voterRegistryAddress, this.registryAbi, this.provider);
    return await registry.isRegistered(voterToken);
  }

  async getElectionStatus(contractAddress) {
    const contract = new ethers.Contract(contractAddress, this.votingAbi, this.provider);
    const startTime = await contract.startTime();
    const endTime = await contract.endTime();
    const resultsPublished = await contract.resultsPublished();
    return { startTime: Number(startTime), endTime: Number(endTime), resultsPublished };
  }
}

module.exports = new BlockchainReadService();
