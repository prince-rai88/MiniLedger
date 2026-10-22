import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every authenticated request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Shared types
export interface Loan {
  id: number;
  user_id: number;
  friend_name: string;
  amount: number;
  due_date: string;
  repaid: boolean;
  repaid_at: string | null;
  created_at: string;
  is_overdue: boolean;
}

export interface Summary {
  total_lent: number;
  total_repaid: number;
  overdue_amount: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function sendOtp(phone: string): Promise<{ message: string }> {
  const res = await api.post('/auth/send-otp', { phone });
  return res.data;
}

export async function verifyOtp(phone: string, otp: string): Promise<{ token: string }> {
  const res = await api.post('/auth/verify-otp', { phone, otp });
  return res.data;
}

// ─── Loans ────────────────────────────────────────────────────────────────────

export async function fetchLoans(): Promise<Loan[]> {
  const res = await api.get('/loans');
  return res.data.loans;
}

export async function createLoan(data: {
  friend_name: string;
  amount: number;
  due_date: string;
}): Promise<Loan> {
  const res = await api.post('/loans', data);
  return res.data.loan;
}

export async function repayLoan(id: number): Promise<Loan> {
  const res = await api.patch(`/loans/${id}/repay`);
  return res.data.loan;
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export async function fetchSummary(): Promise<Summary> {
  const res = await api.get('/summary');
  return res.data;
}

export default api;
