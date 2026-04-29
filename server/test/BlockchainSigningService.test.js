const { ethers } = require('ethers');
const BlockchainSigningService = require('../services/BlockchainSigningService');

jest.mock('ethers', () => {
  return {
    ethers: {
      JsonRpcProvider: jest.fn(),
      Wallet: jest.fn(),
      Contract: jest.fn()
    }
  };
});

describe('BlockchainSigningService', () => {
  let mockContract;

  beforeEach(() => {
    mockContract = {
      createElection: Object.assign(jest.fn(), {
        staticCall: jest.fn()
      }),
      bulkRegisterVoters: jest.fn(),
      castVote: jest.fn(),
      publishResults: jest.fn()
    };
    ethers.Contract.mockImplementation(() => mockContract);
    jest.clearAllMocks();
  });

  it('should deploy election', async () => {
    mockContract.createElection.staticCall.mockResolvedValue('0xNewContract');
    mockContract.createElection.mockResolvedValue({ wait: jest.fn() });

    const addr = await BlockchainSigningService.deployElection('Title', 100, 200, ['A'], ['D'], '0xReg');
    
    expect(addr).toBe('0xNewContract');
    expect(mockContract.createElection).toHaveBeenCalledWith('Title', 100, 200, ['A'], ['D'], '0xReg');
  });

  it('should register voter tokens', async () => {
    mockContract.bulkRegisterVoters.mockResolvedValue({ wait: jest.fn(), hash: '0xHash' });
    const hash = await BlockchainSigningService.registerVoterTokens('0xReg', [1, 2]);
    expect(hash).toBe('0xHash');
  });

  it('should cast vote', async () => {
    mockContract.castVote.mockResolvedValue({ wait: jest.fn(), hash: '0xHash' });
    const hash = await BlockchainSigningService.castVote('0x123', 'token', 1);
    expect(hash).toBe('0xHash');
  });

  it('should publish results', async () => {
    mockContract.publishResults.mockResolvedValue({ wait: jest.fn(), hash: '0xHash' });
    const hash = await BlockchainSigningService.publishResults('0x123');
    expect(hash).toBe('0xHash');
  });
});
