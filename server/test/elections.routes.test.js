const request = require('supertest');
const express = require('express');
const electionsRoutes = require('../routes/elections');
const pool = require('../db/pool');
const BlockchainSigningService = require('../services/BlockchainSigningService');
const EligibilityService = require('../services/EligibilityService');
const AuditService = require('../services/AuditService');

jest.mock('../db/pool');
jest.mock('../services/BlockchainSigningService');
jest.mock('../services/BlockchainReadService');
jest.mock('../services/EligibilityService');
jest.mock('../services/AuditService');

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => { req.user = { userId: 1, role: 'admin' }; next(); },
  requireRole: () => (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/api/elections', electionsRoutes);

describe('Elections Routes', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = { query: jest.fn(), release: jest.fn() };
    pool.connect.mockResolvedValue(mockClient);
    pool.query.mockImplementation((query) => {
      if (query.includes('pg_advisory_lock')) return Promise.resolve();
      if (query.includes('UPDATE elections')) return Promise.resolve();
      return Promise.resolve({ rows: [] });
    });
    jest.clearAllMocks();
  });

  it('GET / should list elections', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ title: 'Elec1' }] }); // select

    const res = await request(app).get('/api/elections');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ title: 'Elec1' }]);
  });

  it('POST / should create an election', async () => {
    BlockchainSigningService.deployElection.mockResolvedValue('0xContract');
    mockClient.query.mockResolvedValueOnce(); // BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [{ election_id: 1 }] }); // INSERT
    mockClient.query.mockResolvedValueOnce(); // candidates
    mockClient.query.mockResolvedValueOnce(); // candidates
    mockClient.query.mockResolvedValueOnce(); // COMMIT

    const res = await request(app).post('/api/elections').send({
      title: 'Title',
      description: 'Desc',
      startTime: new Date(Date.now() + 100000).toISOString(),
      endTime: new Date(Date.now() + 200000).toISOString(),
      candidates: [{ name: 'A', description: '' }, { name: 'B', description: '' }]
    });

    expect(res.status).toBe(201);
    expect(res.body.contractAddress).toBe('0xContract');
  });

  it('POST /:id/vote should cast a vote', async () => {
    EligibilityService.castVote.mockResolvedValue({ success: true, txHash: '0xHash' });
    const res = await request(app).post('/api/elections/1/vote').send({ candidateId: 1 });
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, txHash: '0xHash' });
  });
});
