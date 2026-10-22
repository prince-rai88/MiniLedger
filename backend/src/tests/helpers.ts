/**
 * Test helpers shared across test suites.
 * Uses the test database configured via .env (DB_NAME=minyledger_test).
 * Ensure the test DB exists before running tests:
 *   createdb minyledger_test
 */
import pool from '../db/pool';
import { runMigrations } from '../db/migrate';

let migrated = false;

export async function setupTestDb(): Promise<void> {
  if (!migrated) {
    await runMigrations();
    migrated = true;
  }
  await cleanupTestDb();
}

export async function cleanupTestDb(): Promise<void> {
  // Truncate in dependency order
  await pool.query('TRUNCATE loans, otps, users RESTART IDENTITY CASCADE');
}

// We do NOT close the pool between suites — the pool is a singleton
// and pg will clean up on process exit. Closing it between describe blocks
// causes "Cannot use pool after calling end" errors.
export async function closeTestDb(): Promise<void> {
  // No-op: pool closes automatically when the Node process exits.
}
