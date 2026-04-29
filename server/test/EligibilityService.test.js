const EligibilityService = require('../services/EligibilityService');
const pool = require('../db/pool');
const BlockchainSigningService = require('../services/BlockchainSigningService');
const AuditService = require('../services/AuditService');

jest.mock('../db/pool');
jest.mock('../services/BlockchainSigningService');
jest.mock('../services/AuditService');

describe('EligibilityService', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);
    jest.clearAllMocks();
  });

  it('should successfully cast a vote', async () => {
    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ contract_address: '0x123', status: 'active' }] }) // election
      .mockResolvedValueOnce({ rows: [{ has_voted: false }] }) // eligibility
      .mockResolvedValueOnce() // UPDATE eligibility
      .mockResolvedValueOnce({ rows: [{ voter_token: 'token123' }] }) // user token
      .mockResolvedValueOnce() // UPDATE tx_hash
      .mockResolvedValueOnce(); // COMMIT

    BlockchainSigningService.castVote.mockResolvedValue('0xtxhash');

    const result = await EligibilityService.castVote(1, 100, 2);

    expect(result).toEqual({ success: true, txHash: '0xtxhash' });
    expect(BlockchainSigningService.castVote).toHaveBeenCalledWith('0x123', 'token123', 2);
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
    expect(AuditService.log).toHaveBeenCalledWith(1, 'vote_cast', 'election', 100, { txHash: '0xtxhash', candidateId: 2 });
  });

  it('should throw error if election not found', async () => {
    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [] }); // election not found

    await expect(EligibilityService.castVote(1, 100, 2)).rejects.toThrow('Election not found');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should throw error if election is not active', async () => {
    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ contract_address: '0x123', status: 'closed' }] }); // election closed

    await expect(EligibilityService.castVote(1, 100, 2)).rejects.toThrow('Election is not active');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should throw error if voter is not eligible', async () => {
    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ contract_address: '0x123', status: 'active' }] }) // election
      .mockResolvedValueOnce({ rows: [] }); // not eligible

    await expect(EligibilityService.castVote(1, 100, 2)).rejects.toThrow('Voter not eligible for this election');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('should throw error if voter has already voted', async () => {
    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ contract_address: '0x123', status: 'active' }] }) // election
      .mockResolvedValueOnce({ rows: [{ has_voted: true }] }); // already voted

    await expect(EligibilityService.castVote(1, 100, 2)).rejects.toThrow('Voter has already voted');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('should rollback if blockchain transaction fails', async () => {
    mockClient.query
      .mockResolvedValueOnce() // BEGIN
      .mockResolvedValueOnce({ rows: [{ contract_address: '0x123', status: 'active' }] }) // election
      .mockResolvedValueOnce({ rows: [{ has_voted: false }] }) // eligibility
      .mockResolvedValueOnce() // UPDATE eligibility
      .mockResolvedValueOnce({ rows: [{ voter_token: 'token123' }] }); // user token

    BlockchainSigningService.castVote.mockRejectedValue(new Error('Blockchain Error'));

    await expect(EligibilityService.castVote(1, 100, 2)).rejects.toThrow('Blockchain Error');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});
