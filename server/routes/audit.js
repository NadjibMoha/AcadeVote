const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, requireRole(['admin', 'auditor']), async (req, res, next) => {
  try {
    const { action, startDate, endDate, electionId, username, limit = 25, offset = 0 } = req.query;
    
    let query = `
      SELECT a.*, u.username, e.title as election_title
      FROM audit_log a
      LEFT JOIN users u ON a.user_id = u.user_id
      LEFT JOIN elections e ON (a.entity_type = 'election' AND a.entity_id = e.election_id)
      WHERE 1=1
    `;
    const params = [];
    
    if (action) {
      params.push(action);
      query += ` AND a.action = $${params.length}`;
    }
    if (startDate) {
      params.push(startDate);
      query += ` AND a.created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      query += ` AND a.created_at <= $${params.length}`;
    }
    if (electionId) {
      params.push(electionId);
      query += ` AND (a.entity_type = 'election' AND a.entity_id = $${params.length})`;
    }
    if (username) {
      params.push(`%${username}%`);
      query += ` AND u.username ILIKE $${params.length}`;
    }
    
    query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/export', authenticateToken, requireRole(['admin', 'auditor']), async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.created_at, u.username, a.action, a.entity_type, a.entity_id, a.ip_address
      FROM audit_log a
      LEFT JOIN users u ON a.user_id = u.user_id
      ORDER BY a.created_at DESC
    `);
    
    const csvLines = ['Timestamp,User,Action,EntityType,EntityID,IP'];
    for (const r of rows) {
      csvLines.push(`${r.created_at.toISOString()},${r.username},${r.action || ''},${r.entity_type || ''},${r.entity_id || ''},${r.ip_address || ''}`);
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit_log.csv"');
    res.send(csvLines.join('\n'));
  } catch (err) {
    next(err);
  }
});

router.get('/elections/:id/transactions', authenticateToken, requireRole(['admin', 'auditor']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT contract_address FROM elections WHERE election_id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Election not found' });
    
    const contractAddress = rows[0].contract_address;
    if (!contractAddress) return res.json([]);

    const BlockchainReadService = require('../services/BlockchainReadService');
    const logs = await BlockchainReadService.getVoteTransactions(contractAddress);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
