import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createLoanSchema } from '../services/validation';
import pool from '../db/pool';

const router = Router();

// All loan routes require authentication
router.use(authenticate);

interface LoanRow {
  id: number;
  user_id: number;
  friend_name: string;
  amount: string; // pg returns NUMERIC as string
  due_date: string;
  repaid: boolean;
  repaid_at: string | null;
  created_at: string;
  is_overdue: boolean;
}

/**
 * POST /loans
 * Create a new loan for the authenticated user.
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { friend_name, amount, due_date } = createLoanSchema.parse(req.body);
    const userId = req.user!.userId;

    const { rows } = await pool.query<LoanRow>(
      `INSERT INTO loans (user_id, friend_name, amount, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING
         id,
         user_id,
         friend_name,
         amount::TEXT,
         due_date::TEXT,
         repaid,
         repaid_at,
         created_at`,
      [userId, friend_name, amount, due_date]
    );

    res.status(201).json({ loan: formatLoan(rows[0]) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /loans
 * List all loans for the authenticated user, newest first.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const { rows } = await pool.query<LoanRow>(
      `SELECT
         id,
         user_id,
         friend_name,
         amount::TEXT,
         due_date::TEXT,
         repaid,
         repaid_at,
         created_at,
         (repaid = FALSE AND due_date < CURRENT_DATE) AS is_overdue
       FROM loans
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ loans: rows.map(formatLoan) });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /loans/:id/repay
 * Mark a specific loan as fully repaid.
 * Enforces ownership and prevents duplicate repayment.
 */
router.patch('/:id/repay', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loanId = parseInt(req.params.id, 10);
    const userId = req.user!.userId;

    if (isNaN(loanId)) {
      res.status(400).json({ error: 'Invalid loan ID' });
      return;
    }

    // Fetch loan with ownership check
    const { rows: existing } = await pool.query<LoanRow>(
      `SELECT id, user_id, repaid FROM loans WHERE id = $1`,
      [loanId]
    );

    if (existing.length === 0) {
      res.status(404).json({ error: 'Loan not found' });
      return;
    }

    const loan = existing[0];

    // Ownership check
    if (loan.user_id !== userId) {
      res.status(403).json({ error: 'Forbidden: you do not own this loan' });
      return;
    }

    // Prevent duplicate repayment
    if (loan.repaid) {
      res.status(409).json({ error: 'Loan is already marked as repaid' });
      return;
    }

    const { rows } = await pool.query<LoanRow>(
      `UPDATE loans
       SET repaid = TRUE, repaid_at = NOW()
       WHERE id = $1
       RETURNING
         id,
         user_id,
         friend_name,
         amount::TEXT,
         due_date::TEXT,
         repaid,
         repaid_at,
         created_at`,
      [loanId]
    );

    res.json({ loan: formatLoan(rows[0]) });
  } catch (err) {
    next(err);
  }
});

/** Normalises a DB row into a consistent API shape */
function formatLoan(row: LoanRow) {
  return {
    id: row.id,
    user_id: row.user_id,
    friend_name: row.friend_name,
    amount: parseFloat(row.amount),
    due_date: row.due_date,
    repaid: row.repaid,
    repaid_at: row.repaid_at,
    created_at: row.created_at,
    is_overdue: row.is_overdue ?? (row.repaid === false && new Date(row.due_date) < new Date()),
  };
}

export default router;
