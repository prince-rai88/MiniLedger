import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import pool from '../db/pool';
import { setupTestDb, cleanupTestDb, closeTestDb } from './helpers';
import { signToken } from '../services/jwt.service';

// ─── Loan & Summary Tests ────────────────────────────────────────────────────

/** Utility: create a user directly and return a valid JWT */
async function createUserAndToken(phone: string): Promise<{ userId: number; token: string }> {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO users (phone) VALUES ($1) ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone RETURNING id`,
    [phone]
  );
  const userId = rows[0].id;
  const token = signToken({ userId, phone });
  return { userId, token };
}

describe('Loan Management', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  // ── Auth guards ────────────────────────────────────────────────────────────

  it('rejects unauthenticated loan creation', async () => {
    const res = await request(app)
      .post('/loans')
      .send({ friend_name: 'Alice', amount: 500, due_date: '2025-12-31' });
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated loan list', async () => {
    const res = await request(app).get('/loans');
    expect(res.status).toBe(401);
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  it('rejects loan with negative amount', async () => {
    const { token } = await createUserAndToken('+919600000001');
    const res = await request(app)
      .post('/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ friend_name: 'Bob', amount: -100, due_date: '2025-12-31' });
    expect(res.status).toBe(400);
  });

  it('rejects loan with invalid date format', async () => {
    const { token } = await createUserAndToken('+919600000002');
    const res = await request(app)
      .post('/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ friend_name: 'Carol', amount: 100, due_date: '31-12-2025' });
    expect(res.status).toBe(400);
  });

  it('rejects loan with empty friend_name', async () => {
    const { token } = await createUserAndToken('+919600000003');
    const res = await request(app)
      .post('/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ friend_name: '', amount: 100, due_date: '2025-12-31' });
    expect(res.status).toBe(400);
  });

  // ── CRUD ───────────────────────────────────────────────────────────────────

  it('creates a loan and returns loan object', async () => {
    const { token } = await createUserAndToken('+919600000004');
    const res = await request(app)
      .post('/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ friend_name: 'Dave', amount: 1000.50, due_date: '2025-12-31' });
    expect(res.status).toBe(201);
    expect(res.body.loan).toMatchObject({
      friend_name: 'Dave',
      amount: 1000.50,
      repaid: false,
    });
  });

  it('lists only the authenticated user\'s loans', async () => {
    const { token: token1 } = await createUserAndToken('+919600000005');
    const { token: token2 } = await createUserAndToken('+919600000006');

    await request(app)
      .post('/loans')
      .set('Authorization', `Bearer ${token1}`)
      .send({ friend_name: 'Eve', amount: 200, due_date: '2025-12-31' });

    await request(app)
      .post('/loans')
      .set('Authorization', `Bearer ${token2}`)
      .send({ friend_name: 'Frank', amount: 300, due_date: '2025-12-31' });

    const res = await request(app).get('/loans').set('Authorization', `Bearer ${token1}`);
    expect(res.status).toBe(200);
    expect(res.body.loans).toHaveLength(1);
    expect(res.body.loans[0].friend_name).toBe('Eve');
  });

  // ── Ownership ──────────────────────────────────────────────────────────────

  it('prevents repaying another user\'s loan (ownership check)', async () => {
    const { token: ownerToken } = await createUserAndToken('+919600000007');
    const { token: attackerToken } = await createUserAndToken('+919600000008');

    // Owner creates a loan
    const createRes = await request(app)
      .post('/loans')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ friend_name: 'Grace', amount: 500, due_date: '2025-12-31' });
    const loanId = createRes.body.loan.id;

    // Attacker tries to repay it
    const res = await request(app)
      .patch(`/loans/${loanId}/repay`)
      .set('Authorization', `Bearer ${attackerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  // ── Repayment ─────────────────────────────────────────────────────────────

  it('marks a loan as repaid', async () => {
    const { token } = await createUserAndToken('+919600000009');
    const createRes = await request(app)
      .post('/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ friend_name: 'Heidi', amount: 750, due_date: '2025-12-31' });
    const loanId = createRes.body.loan.id;

    const res = await request(app)
      .patch(`/loans/${loanId}/repay`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.loan.repaid).toBe(true);
    expect(res.body.loan.repaid_at).toBeTruthy();
  });

  it('prevents duplicate repayment', async () => {
    const { token } = await createUserAndToken('+919600000010');
    const createRes = await request(app)
      .post('/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ friend_name: 'Ivan', amount: 300, due_date: '2025-12-31' });
    const loanId = createRes.body.loan.id;

    await request(app)
      .patch(`/loans/${loanId}/repay`)
      .set('Authorization', `Bearer ${token}`);

    // Second repayment attempt
    const res = await request(app)
      .patch(`/loans/${loanId}/repay`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already');
  });

  it('returns 404 for non-existent loan', async () => {
    const { token } = await createUserAndToken('+919600000011');
    const res = await request(app)
      .patch('/loans/99999/repay')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ─── Summary Tests ────────────────────────────────────────────────────────────

describe('Summary API', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('returns zero summary for a new user', async () => {
    const { token } = await createUserAndToken('+919700000001');
    const res = await request(app).get('/summary').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total_lent: 0, total_repaid: 0, overdue_amount: 0 });
  });

  it('calculates correct summary figures', async () => {
    const { token, userId } = await createUserAndToken('+919700000002');

    // Create loans directly in DB for predictable amounts
    // Loan 1: 1000, due future, unpaid
    await pool.query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date) VALUES ($1, 'A', 1000.00, CURRENT_DATE + 10)`,
      [userId]
    );
    // Loan 2: 500, due past, unpaid → OVERDUE
    await pool.query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date) VALUES ($1, 'B', 500.00, CURRENT_DATE - 5)`,
      [userId]
    );
    // Loan 3: 250, repaid
    await pool.query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, repaid, repaid_at)
       VALUES ($1, 'C', 250.00, CURRENT_DATE - 10, TRUE, NOW())`,
      [userId]
    );

    const res = await request(app).get('/summary').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total_lent).toBe(1750); // 1000 + 500 + 250
    expect(res.body.total_repaid).toBe(250); // only Loan 3
    expect(res.body.overdue_amount).toBe(500); // only Loan 2
  });

  it('excludes repaid loans from overdue calculation', async () => {
    const { token, userId } = await createUserAndToken('+919700000003');

    // Repaid loan with past due date — should NOT count as overdue
    await pool.query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, repaid, repaid_at)
       VALUES ($1, 'D', 800.00, CURRENT_DATE - 30, TRUE, NOW())`,
      [userId]
    );

    const res = await request(app).get('/summary').set('Authorization', `Bearer ${token}`);
    expect(res.body.overdue_amount).toBe(0);
    expect(res.body.total_repaid).toBe(800);
  });

  it('requires authentication for summary', async () => {
    const res = await request(app).get('/summary');
    expect(res.status).toBe(401);
  });
});
