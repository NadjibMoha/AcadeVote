const AuditService = require('../services/AuditService');
const pool = require('../db/pool');

jest.mock('../db/pool');

describe('AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully log an action', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });

    await AuditService.log(1, 'TEST_ACTION', 'election', 123, { data: 'test' }, '127.0.0.1');

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, metadata, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [1, 'TEST_ACTION', 'election', 123, { data: 'test' }, '127.0.0.1']
    );
  });

  it('should not throw error if db query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB Error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(AuditService.log(1, 'TEST_ACTION')).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
