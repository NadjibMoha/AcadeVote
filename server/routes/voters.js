const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../db/pool');
const { authenticateToken, requireRole } = require('../middleware/auth');
const AuditService = require('../services/AuditService');

router.use(authenticateToken);
router.use(requireRole(['admin']));

router.get('/', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT ve.eligibility_id, u.user_id, u.username, u.email, ve.has_voted, ve.voted_at 
      FROM voter_eligibility ve
      JOIN users u ON ve.user_id = u.user_id
      WHERE ve.election_id = $1
    `, [id]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { id: electionId } = req.params;
    const { userId } = req.body;
    
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ error: 'Valid userId is required' });
    }

    // Verify user exists
    const { rows: userRows } = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [userId]);
    if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });

    const { rows: electionRows } = await pool.query('SELECT status FROM elections WHERE election_id = $1', [electionId]);
    if (electionRows.length === 0) return res.status(404).json({ error: 'Election not found' });
    if (electionRows[0].status !== 'draft') return res.status(400).json({ error: 'Cannot add voters after election has started' });

    await pool.query('INSERT INTO voter_eligibility (election_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [electionId, userId]);
    
    await AuditService.log(req.user.userId, 'voter_added', 'election', electionId, { addedVoter: userId }, req.ip);
    res.json({ message: 'Voter added successfully' });
  } catch (err) {
    next(err);
  }
});

router.post('/bulk', async (req, res, next) => {
  try {
    const { id: electionId } = req.params;
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Array of userIds required' });
    }

    const { rows: electionRows } = await pool.query('SELECT status FROM elections WHERE election_id = $1', [electionId]);
    if (electionRows.length === 0) return res.status(404).json({ error: 'Election not found' });
    if (electionRows[0].status !== 'draft') return res.status(400).json({ error: 'Cannot add voters after election has started' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const uid of userIds) {
        await client.query('INSERT INTO voter_eligibility (election_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [electionId, uid]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
    await AuditService.log(req.user.userId, 'voters_bulk_added', 'election', electionId, { count: userIds.length }, req.ip);
    res.json({ message: `${userIds.length} voters added` });
  } catch (err) {
    next(err);
  }
});

router.delete('/:userId', async (req, res, next) => {
  try {
    const { id: electionId, userId } = req.params;
    
    const { rows: electionRows } = await pool.query('SELECT status FROM elections WHERE election_id = $1', [electionId]);
    if (electionRows.length === 0) return res.status(404).json({ error: 'Election not found' });
    if (electionRows[0].status !== 'draft') return res.status(400).json({ error: 'Cannot remove voters after election has started' });

    await pool.query('DELETE FROM voter_eligibility WHERE election_id = $1 AND user_id = $2', [electionId, userId]);
    
    await AuditService.log(req.user.userId, 'voter_removed', 'election', electionId, { removedVoter: userId }, req.ip);
    res.json({ message: 'Voter removed successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
