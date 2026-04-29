const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const pool = require('../db/pool');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../db/pool');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /login should login successfully', async () => {
    pool.query.mockResolvedValue({ rows: [{ user_id: 1, password_hash: 'hash', role: 'admin' }] });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('fake_token');

    const res = await request(app).post('/api/auth/login').send({ username: 'test', password: 'password' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token', 'fake_token');
  });

  it('POST /login should fail with bad credentials', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const res = await request(app).post('/api/auth/login').send({ username: 'test', password: 'password' });
    expect(res.status).toBe(401);
  });
});
