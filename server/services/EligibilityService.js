const pool = require('../db/pool');
const BlockchainSigningService = require('./BlockchainSigningService');
const AuditService = require('./AuditService');

class EligibilityService {
  async castVote(userId, electionId, candidateId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const electionResult = await client.query('SELECT contract_address, status FROM elections WHERE election_id = $1', [electionId]);
      if (electionResult.rows.length === 0) throw new Error('Election not found');
      const election = electionResult.rows[0];
      if (election.status !== 'active') throw new Error('Election is not active');

      const eligibilityResult = await client.query(
        'SELECT has_voted FROM voter_eligibility WHERE election_id = $1 AND user_id = $2 FOR UPDATE',
        [electionId, userId]
      );
      
      if (eligibilityResult.rows.length === 0) throw new Error('Voter not eligible for this election');
      if (eligibilityResult.rows[0].has_voted) throw new Error('Voter has already voted');

      await client.query(
        'UPDATE voter_eligibility SET has_voted = TRUE, voted_at = NOW() WHERE election_id = $1 AND user_id = $2',
        [electionId, userId]
      );

      const userResult = await client.query('SELECT voter_token FROM users WHERE user_id = $1', [userId]);
      const voterToken = userResult.rows[0].voter_token;
      const tokenStr = voterToken.toString();

      // Blockchain call is INSIDE the transaction — if it fails, we ROLLBACK
      const txHash = await BlockchainSigningService.castVote(election.contract_address, tokenStr, candidateId);

      await client.query(
        'UPDATE voter_eligibility SET tx_hash = $1 WHERE election_id = $2 AND user_id = $3',
        [txHash, electionId, userId]
      );

      await client.query('COMMIT');

      await AuditService.log(userId, 'vote_cast', 'election', electionId, { txHash, candidateId });
      return { success: true, txHash };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new EligibilityService();
