import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import pool from '../db/pool';

const router = Router();

router.use(authenticate);

interface SummaryRow {
  total_lent: string;
  total_repaid: string;
  overdue_amount: string;
}

/**
 * GET /summary
 * Returns financial summary for the authenticated user.
 *
 * - total_lent:    SUM of all loan amounts (regardless of repayment status)
 * - total_repaid:  SUM of amounts for fully repaid loans
 * - overdue_amount: SUM of unpaid loans whose due_date < TODAY
 *
 * All monetary values use NUMERIC in PostgreSQL for decimal safety.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const { rows } = await pool.query<SummaryRow>(
      `SELECT
         COALESCE(SUM(amount), 0)::TEXT                                AS total_lent,
         COALESCE(SUM(amount) FILTER (WHERE repaid = TRUE), 0)::TEXT   AS total_repaid,
         COALESCE(SUM(amount) FILTER (
           WHERE repaid = FALSE AND due_date < CURRENT_DATE
         ), 0)::TEXT                                                    AS overdue_amount
       FROM loans
       WHERE user_id = $1`,
      [userId]
    );

    const row = rows[0];
    res.json({
      total_lent: parseFloat(row.total_lent),
      total_repaid: parseFloat(row.total_repaid),
      overdue_amount: parseFloat(row.overdue_amount),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
