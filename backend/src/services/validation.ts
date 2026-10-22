import { z } from 'zod';

/** Phone number: 10–15 digits, optional leading + */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number');

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
});

export const createLoanSchema = z.object({
  friend_name: z.string().trim().min(1, 'Friend name is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'due_date must be YYYY-MM-DD')
    .refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
