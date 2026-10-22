import pool from '../db/pool';

interface OtpRecord {
  id: number;
  phone: string;
  code: string;
  attempts: number;
  verified: boolean;
  expires_at: Date;
}

const OTP_EXPIRES_IN_MINUTES = parseInt(process.env.OTP_EXPIRES_IN_MINUTES || '5', 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10);

/**
 * Generates a cryptographically-random 6-digit OTP string.
 * Uses Math.random seeded approach for simplicity in mock context.
 * In production replace with crypto.randomInt.
 */
function generateOtpCode(): string {
  // Use crypto for secure random generation
  const { randomInt } = require('crypto') as typeof import('crypto');
  return randomInt(100000, 999999).toString();
}

/**
 * Creates a new OTP for the given phone number.
 * Invalidates any existing unverified OTPs for that phone.
 *
 * ⚠️  The OTP code is printed to the SERVER LOG only — never returned to the client.
 * To view the OTP during development: watch the terminal running `npm run dev`.
 */
export async function createOtp(phone: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Invalidate all previous OTPs for this phone
    await client.query(
      `UPDATE otps SET verified = TRUE WHERE phone = $1 AND verified = FALSE`,
      [phone]
    );

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);

    await client.query(
      `INSERT INTO otps (phone, code, attempts, verified, expires_at)
       VALUES ($1, $2, 0, FALSE, $3)`,
      [phone, code, expiresAt]
    );

    await client.query('COMMIT');

    // 🔒 OTP printed to SERVER LOG only — never sent in API response
    console.log(`\n========================================`);
    console.log(`📱 OTP FOR ${phone}: ${code}`);
    console.log(`   Expires in ${OTP_EXPIRES_IN_MINUTES} minutes`);
    console.log(`========================================\n`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export type OtpVerifyResult =
  | { success: true; userId: number }
  | { success: false; error: string; attemptsLeft?: number };

/**
 * Verifies the OTP code for a phone number.
 * Creates the user account if this is their first login.
 */
export async function verifyOtp(phone: string, code: string): Promise<OtpVerifyResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch the latest unverified OTP
    const { rows } = await client.query<OtpRecord>(
      `SELECT * FROM otps
       WHERE phone = $1 AND verified = FALSE
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'No active OTP found. Please request a new one.' };
    }

    const otp = rows[0];

    // Check expiry
    if (new Date() > otp.expires_at) {
      await client.query(`UPDATE otps SET verified = TRUE WHERE id = $1`, [otp.id]);
      await client.query('COMMIT');
      return { success: false, error: 'OTP has expired. Please request a new one.' };
    }

    // Check attempt limit BEFORE processing the code (already locked out)
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      // Already over the limit — invalidate and reject
      await client.query(`UPDATE otps SET verified = TRUE WHERE id = $1`, [otp.id]);
      await client.query('COMMIT');
      return { success: false, error: 'Too many failed attempts. Please request a new OTP.' };
    }

    // Wrong code — increment attempts
    if (otp.code !== code) {
      const newAttempts = otp.attempts + 1;

      if (newAttempts >= OTP_MAX_ATTEMPTS) {
        // This was the last allowed attempt — invalidate immediately
        await client.query(
          `UPDATE otps SET attempts = $1, verified = TRUE WHERE id = $2`,
          [newAttempts, otp.id]
        );
        await client.query('COMMIT');
        return { success: false, error: 'Too many failed attempts. Please request a new OTP.', attemptsLeft: 0 };
      }

      await client.query(`UPDATE otps SET attempts = $1 WHERE id = $2`, [newAttempts, otp.id]);
      await client.query('COMMIT');
      return {
        success: false,
        error: 'Invalid OTP',
        attemptsLeft: OTP_MAX_ATTEMPTS - newAttempts,
      };
    }

    // ✅ Code is correct — mark OTP verified
    await client.query(`UPDATE otps SET verified = TRUE WHERE id = $1`, [otp.id]);

    // Upsert user
    const userResult = await client.query<{ id: number }>(
      `INSERT INTO users (phone) VALUES ($1)
       ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
       RETURNING id`,
      [phone]
    );

    await client.query('COMMIT');
    return { success: true, userId: userResult.rows[0].id };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
