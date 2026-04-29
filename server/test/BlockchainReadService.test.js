const { ethers } = require('ethers');
const BlockchainReadService = require('../services/BlockchainReadService');

jest.mock('ethers', () => {
  return {
    ethers: {
      JsonRpcProvider: jest.fn(),
      Contract: jest.fn()
    }
  };
});

describe('BlockchainReadService', () => {
  let mockContract;

  beforeEach(() => {
    mockContract = {
      getResults: jest.fn(),
      queryFilter: jest.fn(),
      filters: { VoteCast: jest.fn() },
      isRegistered: jest.fn(),
      startTime: jest.fn(),
      endTime: jest.fn(),
      resultsPublished: jest.fn()
    };
    ethers.Contract.mockImplementation(() => mockContract);
    jest.clearAllMocks();
  });

  it('should get election results', async () => {
    mockContract.getResults.mockResolvedValue([['Alice'], ['Desc'], [10n]]);
    
    const results = await BlockchainReadService.getElectionResults('0x123');
    
    expect(results).toEqual({
      names: ['Alice'],
      descriptions: ['Desc'],
      voteCounts: [10]
    });
  });

  it('should get vote transactions', async () => {
    const mockEvent = {
      args: ['123', 1n, 1600000000n],
      transactionHash: '0xhash'
    };
    mockContract.queryFilter.mockResolvedValue([mockEvent]);

    const events = await BlockchainReadService.getVoteTransactions('0x123');
    
    expect(events).toEqual([{
      voterToken: '123',
      candidateId: 1,
      timestamp: 1600000000,
      txHash: '0xhash'
    }]);
  });

  it('should check if voter is registered', async () => {
    mockContract.isRegistered.mockResolvedValue(true);
    const result = await BlockchainReadService.isVoterRegistered('0xReg', 'token123');
    expect(result).toBe(true);
  });

  it('should get election status', async () => {
    mockContract.startTime.mockResolvedValue(1000n);
    mockContract.endTime.mockResolvedValue(2000n);
    mockContract.resultsPublished.mockResolvedValue(false);

    const status = await BlockchainReadService.getElectionStatus('0x123');
    expect(status).toEqual({
      startTime: 1000,
      endTime: 2000,
      resultsPublished: false
    });
  });
});
