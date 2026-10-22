import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load test environment before tests run
config({ path: '.env.test' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    // Run test files sequentially to avoid DB race conditions
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    env: {
      NODE_ENV: 'test',
      DB_NAME: 'minyledger_test',
      DB_USER: process.env.USER || 'princerai',
      DB_PASSWORD: '',
      JWT_SECRET: 'test_secret_minyledger_dev_only_32chars_long',
      OTP_MAX_ATTEMPTS: '3',
      OTP_EXPIRES_IN_MINUTES: '5',
    },
  },
});
