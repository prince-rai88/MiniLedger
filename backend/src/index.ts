import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { runMigrations } from './db/migrate';
import authRoutes from './routes/auth.routes';
import loanRoutes from './routes/loans.routes';
import summaryRoutes from './routes/summary.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*', // Restrict to specific origins in production
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/loans', loanRoutes);
app.use('/summary', summaryRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start (only when run directly, not imported by tests) ───────────────────
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      await runMigrations();
      app.listen(PORT, () => {
        console.log(`🚀 MiniLedger API running on http://localhost:${PORT}`);
        console.log(`📋 Health check: http://localhost:${PORT}/health`);
        console.log(`\n🔑 OTP codes will be printed in this terminal — check here during development!\n`);
      });
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  })();
}

export default app;
