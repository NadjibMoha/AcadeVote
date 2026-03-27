const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticateToken, requireRole } = require('../middleware/auth');
const BlockchainSigningService = require('../services/BlockchainSigningService');
const BlockchainReadService = require('../services/BlockchainReadService');
const EligibilityService = require('../services/EligibilityService');
const AuditService = require('../services/AuditService');

const voterRoutes = require('./voters');
// Attach voter routes to /:id/voters
router.use('/:id/voters', voterRoutes);

// Helper to refresh election status based on time (uses advisory lock to prevent races)
const refreshElectionStatuses = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(1)');
    await client.query(`
      UPDATE elections 
      SET status = 'active'
      WHERE status = 'draft' AND start_time <= NOW() AND end_time > NOW()
    `);
    await client.query(`
      UPDATE elections 
      SET status = 'closed'
      WHERE status = 'active' AND end_time <= NOW()
    `);
    await client.query('SELECT pg_advisory_unlock(1)');
  } finally {
    client.release();
  }
};

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    await refreshElectionStatuses();
    
    let query, params;
    if (req.user.role === 'voter') {
      query = `
        SELECT e.*, ve.has_voted
        FROM elections e
        JOIN voter_eligibility ve ON e.election_id = ve.election_id
        WHERE ve.user_id = $1 AND e.status IN ('active', 'closed', 'results_published')
        ORDER BY e.start_time DESC
      `;
      params = [req.user.userId];
    } else {
      query = `SELECT * FROM elections ORDER BY created_at DESC`;
      params = [];
    }
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { title, description, startTime, endTime, candidates } = req.body;
    
    if (new Date(endTime) <= new Date(startTime)) return res.status(400).json({ error: 'End time must be after start time' });
    if (!candidates || candidates.length < 2) return res.status(400).json({ error: 'At least 2 candidates required' });

    const eStart = Math.floor(new Date(startTime).getTime() / 1000);
    const eEnd = Math.floor(new Date(endTime).getTime() / 1000);
    const cNames = candidates.map(c => c.name);
    const cDescs = candidates.map(c => c.description || '');

    // Deploy smart contract
    let contractAddress;
    try {
      contractAddress = await BlockchainSigningService.deployElection(
        title, eStart, eEnd, cNames, cDescs, process.env.VOTER_REGISTRY_ADDRESS
      );
    } catch (e) {
      console.error('Failed to deploy election contract:', e);
      return res.status(500).json({ error: 'Blockchain deployment failed' });
    }

    const client = await pool.connect();
    let electionId;
    try {
      await client.query('BEGIN');
      // Determine initial status based on schedule
      let initialStatus = 'draft';
      const now = new Date();
      if (new Date(startTime) <= now && new Date(endTime) > now) initialStatus = 'active';
      else if (new Date(endTime) <= now) initialStatus = 'closed';

      const electionResult = await client.query(
        'INSERT INTO elections (title, description, start_time, end_time, status, created_by, contract_address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING election_id',
        [title, description, startTime, endTime, initialStatus, req.user.userId, contractAddress]
      );
      electionId = electionResult.rows[0].election_id;

      for (let i = 0; i < candidates.length; i++) {
        await client.query(
          'INSERT INTO candidates (election_id, name, description, position) VALUES ($1, $2, $3, $4)',
          [electionId, candidates[i].name, candidates[i].description, i]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    AuditService.log(req.user.userId, 'election_created', 'election', electionId, { contractAddress }, req.ip);
    res.status(201).json({ message: 'Election created', electionId, contractAddress });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    await refreshElectionStatuses();
    const { id } = req.params;
    
    const { rows: elections } = await pool.query('SELECT * FROM elections WHERE election_id = $1', [id]);
    if (elections.length === 0) return res.status(404).json({ error: 'Election not found' });
    
    const { rows: candidates } = await pool.query('SELECT * FROM candidates WHERE election_id = $1 ORDER BY position ASC', [id]);
    
    res.json({ ...elections[0], candidates });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    const { rows } = await pool.query('SELECT status FROM elections WHERE election_id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Election not found' });
    if (rows[0].status !== 'draft') return res.status(400).json({ error: 'Only draft elections can be modified' });

    await pool.query('UPDATE elections SET title = $1, description = $2 WHERE election_id = $3', [title, description, id]);
    AuditService.log(req.user.userId, 'election_updated', 'election', id, null, req.ip);
    res.json({ message: 'Election updated' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT status FROM elections WHERE election_id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Election not found' });
    if (rows[0].status !== 'draft') return res.status(400).json({ error: 'Only draft elections can be deleted' });

    await pool.query('DELETE FROM elections WHERE election_id = $1', [id]);
    AuditService.log(req.user.userId, 'election_deleted', 'election', id, null, req.ip);
    res.json({ message: 'Election deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/publish-results', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT status, contract_address FROM elections WHERE election_id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Election not found' });
    
    const e = rows[0];
    if (e.status !== 'closed') return res.status(400).json({ error: 'Election must be closed to publish results' });

    let txHash;
    try {
      txHash = await BlockchainSigningService.publishResults(e.contract_address);
    } catch (blockchainError) {
      return res.status(500).json({ error: 'Blockchain transaction failed' });
    }

    const results = await BlockchainReadService.getElectionResults(e.contract_address);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE elections SET status = 'results_published' WHERE election_id = $1`, [id]);
      
      const { rows: candidates } = await client.query('SELECT candidate_id, position FROM candidates WHERE election_id = $1 ORDER BY position ASC', [id]);
      
      for (let i = 0; i < candidates.length; i++) {
        await client.query(
          'INSERT INTO election_results (election_id, candidate_id, vote_count) VALUES ($1, $2, $3)',
          [id, candidates[i].candidate_id, results.voteCounts[i]]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
    AuditService.log(req.user.userId, 'results_published', 'election', id, { txHash }, req.ip);
    res.json({ message: 'Results published successfully', txHash });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/stats', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_voters,
        COUNT(*) FILTER (WHERE has_voted = TRUE) as votes_cast
      FROM voter_eligibility WHERE election_id = $1
    `, [id]);
    
    res.json(stats.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/results', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: electionRows } = await pool.query('SELECT status FROM elections WHERE election_id = $1', [id]);
    if (electionRows.length === 0) return res.status(404).json({ error: 'Election not found' });
    if (electionRows[0].status !== 'results_published') {
      return res.status(400).json({ error: 'Results are not published yet' });
    }

    const { rows } = await pool.query(`
      SELECT c.name, c.description, er.vote_count
      FROM election_results er
      JOIN candidates c ON er.candidate_id = c.candidate_id
      WHERE er.election_id = $1
      ORDER BY er.vote_count DESC
    `, [id]);
    
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Vote Casting Endpoint
router.post('/:id/vote', authenticateToken, requireRole(['voter']), async (req, res, next) => {
  try {
    const { id: electionId } = req.params;
    const { candidateId } = req.body;
    if (candidateId === undefined) return res.status(400).json({ error: 'Candidate ID required' });

    const result = await EligibilityService.castVote(req.user.userId, electionId, candidateId);
    res.json(result);
  } catch (err) {
    if (err.message === 'Voter has already voted' || err.message === 'Election is not active' || err.message === 'Voter not eligible for this election') {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/:id/vote/status', authenticateToken, requireRole(['voter']), async (req, res, next) => {
  try {
    const { id: electionId } = req.params;
    const { rows } = await pool.query('SELECT has_voted, tx_hash FROM voter_eligibility WHERE election_id = $1 AND user_id = $2', [electionId, req.user.userId]);
    if (rows.length === 0) return res.json({ eligible: false });
    
    res.json({ eligible: true, hasVoted: rows[0].has_voted, txHash: rows[0].tx_hash });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
