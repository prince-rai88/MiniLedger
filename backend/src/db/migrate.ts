import pool from './pool';

const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  phone       VARCHAR(20) UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- OTP table
CREATE TABLE IF NOT EXISTS otps (
  id          SERIAL PRIMARY KEY,
  phone       VARCHAR(20) NOT NULL,
  code        VARCHAR(6)  NOT NULL,
  attempts    INTEGER     DEFAULT 0,
  verified    BOOLEAN     DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast OTP lookup
CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);

-- Loans table (amounts stored as NUMERIC for decimal safety)
CREATE TABLE IF NOT EXISTS loans (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_name  VARCHAR(100) NOT NULL,
  amount       NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  due_date     DATE        NOT NULL,
  repaid       BOOLEAN     DEFAULT FALSE,
  repaid_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user loan lookups
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
`;

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(schema);
    console.log('✅ Database migrations completed');
  } catch (err) {
    console.error('❌ Migration error:', err);
    throw err;
  } finally {
    client.release();
  }
}
