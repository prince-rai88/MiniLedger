import { Router, Request, Response, NextFunction } from 'express';
import { sendOtpSchema, verifyOtpSchema } from '../services/validation';
import { createOtp, verifyOtp } from '../services/otp.service';
import { signToken } from '../services/jwt.service';
import pool from '../db/pool';

const router = Router();

/**
 * POST /auth/send-otp
 * Body: { phone: string }
 * Generates a 6-digit OTP and prints it to the SERVER LOG.
 * The OTP is never included in the API response.
 */
router.post('/send-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = sendOtpSchema.parse(req.body);
    await createOtp(phone);
    res.json({ message: 'OTP sent. Check the server log to view the code during development.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/verify-otp
 * Body: { phone: string, otp: string }
 * Returns a JWT on success. Never reveals the correct OTP on failure.
 */
router.post('/verify-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = verifyOtpSchema.parse(req.body);
    const result = await verifyOtp(phone, otp);

    if (!result.success) {
      const status = result.error.includes('Too many') || result.error.includes('expired') ? 429 : 400;
      res.status(status).json({
        error: result.error,
        ...(result.attemptsLeft !== undefined && { attemptsLeft: result.attemptsLeft }),
      });
      return;
    }

    // Look up user phone from DB for payload
    const { rows } = await pool.query<{ phone: string }>(
      `SELECT phone FROM users WHERE id = $1`,
      [result.userId]
    );

    const token = signToken({ userId: result.userId, phone: rows[0].phone });
    res.json({ token, userId: result.userId });
  } catch (err) {
    next(err);
  }
});

export default router;
