import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import pool from '../db/pool';
import { setupTestDb, cleanupTestDb, closeTestDb } from './helpers';

// ─── OTP & Auth Tests ────────────────────────────────────────────────────────

describe('OTP Flow', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  it('rejects send-otp with missing phone', async () => {
    const res = await request(app).post('/auth/send-otp').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation error');
  });

  it('rejects send-otp with invalid phone format', async () => {
    const res = await request(app).post('/auth/send-otp').send({ phone: 'abc' });
    expect(res.status).toBe(400);
  });

  it('rejects verify-otp with non-numeric OTP', async () => {
    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: '+919999999999', otp: 'abc123' });
    expect(res.status).toBe(400);
  });

  it('rejects verify-otp with OTP shorter than 6 digits', async () => {
    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: '+919999999999', otp: '12345' });
    expect(res.status).toBe(400);
  });

  // ── Core OTP flow ─────────────────────────────────────────────────────────

  it('returns 200 and a message when send-otp succeeds', async () => {
    const res = await request(app).post('/auth/send-otp').send({ phone: '+919999999999' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('OTP sent');
    // OTP must NOT be in the response body
    expect(JSON.stringify(res.body)).not.toMatch(/\d{6}/);
  });

  it('issues a JWT on correct OTP verification', async () => {
    const phone = '+919111111111';
    await request(app).post('/auth/send-otp').send({ phone });

    // Retrieve the OTP directly from DB (simulating server log access in tests)
    const { rows } = await pool.query(
      `SELECT code FROM otps WHERE phone = $1 AND verified = FALSE ORDER BY created_at DESC LIMIT 1`,
      [phone]
    );
    const code = rows[0].code;

    const res = await request(app).post('/auth/verify-otp').send({ phone, otp: code });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.split('.')).toHaveLength(3); // JWT structure
  });

  it('rejects wrong OTP and returns attemptsLeft', async () => {
    const phone = '+919222222222';
    await request(app).post('/auth/send-otp').send({ phone });

    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone, otp: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid OTP');
    expect(res.body.attemptsLeft).toBeDefined();
  });

  it('blocks after max failed attempts', async () => {
    const phone = '+919333333333';
    await request(app).post('/auth/send-otp').send({ phone });

    // OTP_MAX_ATTEMPTS = 3
    // Attempt 1 — returns 400 with attemptsLeft=2
    await request(app).post('/auth/verify-otp').send({ phone, otp: '000000' });
    // Attempt 2 — returns 400 with attemptsLeft=1
    await request(app).post('/auth/verify-otp').send({ phone, otp: '000000' });
    // Attempt 3 — hits the limit, OTP is invalidated, returns 429
    const thirdRes = await request(app)
      .post('/auth/verify-otp')
      .send({ phone, otp: '000000' });
    // The 3rd attempt exhausts attempts → OTP is locked and removed
    expect(thirdRes.status === 400 || thirdRes.status === 429).toBe(true);
    expect(thirdRes.body.error).toContain('Too many');

    // Any subsequent attempt should also return 400/429 (no active OTP)
    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone, otp: '000000' });
    expect(res.status === 400 || res.status === 429).toBe(true);
    expect(
      res.body.error.includes('Too many') || res.body.error.includes('No active OTP')
    ).toBe(true);
  });

  it('rejects expired OTP', async () => {
    const phone = '+919444444444';
    await request(app).post('/auth/send-otp').send({ phone });

    // Manually expire the OTP
    await pool.query(
      `UPDATE otps SET expires_at = NOW() - INTERVAL '1 minute' WHERE phone = $1`,
      [phone]
    );

    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone, otp: '123456' });
    expect(res.status === 400 || res.status === 429).toBe(true);
    expect(res.body.error).toContain('expired');
  });

  it('invalidates previous OTP when new one is requested', async () => {
    const phone = '+919555555555';
    await request(app).post('/auth/send-otp').send({ phone });

    // Get first OTP
    const { rows: firstRows } = await pool.query(
      `SELECT code FROM otps WHERE phone = $1 ORDER BY created_at DESC LIMIT 1`,
      [phone]
    );
    const firstCode = firstRows[0].code;

    // Request new OTP — this marks the first one as verified
    await request(app).post('/auth/send-otp').send({ phone });

    // Old OTP is now verified=TRUE; trying it should fail
    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone, otp: firstCode });
    expect(res.status).toBe(400);
    // Either no active OTP found, or wrong code for the new active OTP
    expect(res.body.error).toBeTruthy();
  });
});
