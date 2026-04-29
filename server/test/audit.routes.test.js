const request = require('supertest');
const express = require('express');
const auditRoutes = require('../routes/audit');
const pool = require('../db/pool');

jest.mock('../db/pool');
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => { req.user = { userId: 1, role: 'auditor' }; next(); },
  requireRole: () => (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/api/audit', auditRoutes);

describe('Audit Routes', () => {
  it('GET / should return audit logs', async () => {
    const mockLogs = [{ log_id: 1, action: 'test' }];
    pool.query.mockResolvedValue({ rows: mockLogs });

    const res = await request(app).get('/api/audit');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockLogs);
  });
});
