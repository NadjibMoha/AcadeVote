const pool = require('../db/pool');

class AuditService {
  async log(userId, action, entityType = null, entityId = null, metadata = null, ipAddress = null) {
    try {
      await pool.query(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, metadata, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, action, entityType, entityId, metadata, ipAddress]
      );
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }
}

module.exports = new AuditService();
