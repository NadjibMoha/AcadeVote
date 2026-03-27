const pool = require('./pool');

const runMigrations = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
          user_id       SERIAL PRIMARY KEY,
          username      VARCHAR(100) UNIQUE NOT NULL,
          email         VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'voter', 'auditor')),
          voter_token   NUMERIC UNIQUE,
          created_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Create elections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS elections (
          election_id       SERIAL PRIMARY KEY,
          title             VARCHAR(255) NOT NULL,
          description       TEXT,
          start_time        TIMESTAMPTZ NOT NULL,
          end_time          TIMESTAMPTZ NOT NULL,
          status            VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','active','closed','results_published')),
          contract_address  VARCHAR(42),
          created_by        INTEGER REFERENCES users(user_id),
          created_at        TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Create candidates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidates (
          candidate_id  SERIAL PRIMARY KEY,
          election_id   INTEGER REFERENCES elections(election_id) ON DELETE CASCADE,
          name          VARCHAR(255) NOT NULL,
          description   TEXT,
          position      INTEGER NOT NULL
      );
    `);
    
    // Create voter_eligibility table
    await client.query(`
      CREATE TABLE IF NOT EXISTS voter_eligibility (
          eligibility_id SERIAL PRIMARY KEY,
          election_id    INTEGER REFERENCES elections(election_id) ON DELETE CASCADE,
          user_id        INTEGER REFERENCES users(user_id),
          has_voted      BOOLEAN DEFAULT FALSE,
          voted_at       TIMESTAMPTZ,
          tx_hash        VARCHAR(66),
          UNIQUE(election_id, user_id)
      );
    `);
    
    // Create audit_log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
          log_id      SERIAL PRIMARY KEY,
          user_id     INTEGER REFERENCES users(user_id),
          action      VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50),
          entity_id   INTEGER,
          metadata    JSONB,
          ip_address  VARCHAR(45),
          created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Create election_results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS election_results (
          result_id    SERIAL PRIMARY KEY,
          election_id  INTEGER REFERENCES elections(election_id),
          candidate_id INTEGER REFERENCES candidates(candidate_id),
          vote_count   INTEGER NOT NULL,
          published_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    await client.query('COMMIT');
    console.log('Database schema migrated successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
};

runMigrations();
