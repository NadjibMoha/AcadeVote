const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');
const AuditService = require('../services/AuditService');

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.user_id, username: user.username, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await AuditService.log(user.user_id, 'login', 'user', user.user_id, { email: user.email }, req.ip);

    res.json({ token, user: { userId: user.user_id, username: user.username, role: user.role, email: user.email } });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  await AuditService.log(req.user.userId, 'logout', 'user', req.user.userId, null, req.ip);
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
