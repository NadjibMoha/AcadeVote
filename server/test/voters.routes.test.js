const request = require('supertest');
const express = require('express');
const votersRoutes = require('../routes/voters');
const pool = require('../db/pool');
const AuditService = require('../services/AuditService');

jest.mock('../db/pool');
jest.mock('../services/AuditService');
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => { req.user = { userId: 1, role: 'admin' }; next(); },
  requireRole: () => (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/api/elections/:id/voters', votersRoutes);

describe('Voters Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET / should return voters', async () => {
    pool.query.mockResolvedValue({ rows: [{ user_id: 2, username: 'voter1' }] });
    const res = await request(app).get('/api/elections/1/voters');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ user_id: 2, username: 'voter1' }]);
  });

  it('POST / should add a voter to draft election', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 2 }] }) // user exists
      .mockResolvedValueOnce({ rows: [{ status: 'draft' }] }) // election status
      .mockResolvedValueOnce(); // insert

    const res = await request(app).post('/api/elections/1/voters').send({ userId: 2 });
    expect(res.status).toBe(200);
    expect(AuditService.log).toHaveBeenCalled();
  });
});
