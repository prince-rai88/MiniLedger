# MiniLedger 💰

A full-stack personal finance app for tracking loans to friends. Built as a full-stack internship assignment.

## Stack

| Layer      | Technology                                         |
|------------|---------------------------------------------------|
| Mobile     | React Native + Expo SDK 53 + TypeScript           |
| Backend    | Node.js + Express + TypeScript                    |
| Database   | PostgreSQL 18 (via `pg` library)                  |
| Auth       | Mock phone OTP + JWT (jsonwebtoken)               |
| Validation | Zod                                               |
| Testing    | Vitest + Supertest                                |

---

## Project Structure

```
MiniLedger/
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── db/
│   │   │   ├── pool.ts          # PostgreSQL connection pool
│   │   │   └── migrate.ts       # Schema & auto-migrations
│   │   ├── routes/
│   │   │   ├── auth.routes.ts   # /auth/send-otp, /auth/verify-otp
│   │   │   ├── loans.routes.ts  # /loans CRUD
│   │   │   └── summary.routes.ts# /summary aggregates
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   # JWT guard
│   │   │   └── error.middleware.ts  # Centralized error handler
│   │   ├── services/
│   │   │   ├── otp.service.ts   # OTP generation, expiry, attempt limits
│   │   │   ├── jwt.service.ts   # JWT sign/verify
│   │   │   └── validation.ts    # Zod schemas
│   │   ├── tests/
│   │   │   ├── otp.test.ts      # OTP flow tests (10 tests)
│   │   │   ├── loans.test.ts    # Loan + summary tests (15 tests)
│   │   │   └── helpers.ts       # Test DB setup/teardown
│   │   └── index.ts             # Express app entry point
│   ├── .env.example             # Environment variable template
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
└── mobile/                      # React Native + Expo app
    ├── app/                     # Expo Router file-based routing
    │   ├── _layout.tsx          # Root layout + auth check
    │   ├── login.tsx            # Phone + OTP login screen
    │   ├── add-loan.tsx         # Add loan modal
    │   └── (tabs)/
    │       ├── _layout.tsx      # Tab navigator
    │       ├── dashboard.tsx    # Summary cards + quick actions
    │       └── loans.tsx        # Loan list with repay
    ├── src/
    │   ├── components/
    │   │   ├── Button.tsx       # Multi-variant button
    │   │   ├── Input.tsx        # Themed text input
    │   │   ├── LoanCard.tsx     # Loan item with repay action
    │   │   └── SummaryCard.tsx  # Financial summary tile
    │   ├── services/
    │   │   └── api.ts           # Axios client + all API calls
    │   └── utils/
    │       ├── storage.ts       # expo-secure-store wrapper
    │       └── theme.ts         # Design tokens (colors, spacing, etc.)
    ├── .env.example
    └── package.json
```

---

## Prerequisites (macOS)

```bash
# Node.js 18+ (v24 tested)
node --version

# PostgreSQL via Homebrew
brew install postgresql@18
brew services start postgresql@18

# Expo CLI
npm install -g expo-cli

# iOS Simulator (Xcode required) or use Expo Go on physical device
```

---

## Quick Setup

### 1. Clone and install

```bash
git clone https://github.com/prince-rai88/MiniLedger.git
cd MiniLedger

# Install backend dependencies
cd backend && npm install

# Install mobile dependencies
cd ../mobile && npm install
```

### 2. Set up PostgreSQL databases

```bash
# Create dev and test databases (uses your macOS system user, no password)
psql postgres -c "CREATE DATABASE minyledger;"
psql postgres -c "CREATE DATABASE minyledger_test;"
```

### 3. Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=minyledger
DB_USER=your_postgres_user   # on macOS with Homebrew, usually your system username
DB_PASSWORD=                  # leave blank if no password

JWT_SECRET=change_this_to_a_random_32_char_string
JWT_EXPIRES_IN=7d

OTP_EXPIRES_IN_MINUTES=5
OTP_MAX_ATTEMPTS=3
```

### 4. Configure mobile environment

```bash
cd mobile
cp .env.example .env
```

Edit `.env`:
```env
# For iOS Simulator:
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# For a physical device on the same WiFi (replace with your Mac's IP):
# EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000
# Find your IP: ifconfig | grep "inet " | grep -v 127.0.0.1
```

---

## Running the Application

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

The server starts on `http://localhost:3000`. You will see:
```
✅ Database migrations completed
🚀 MiniLedger API running on http://localhost:3000
🔑 OTP codes will be printed in this terminal — check here during development!
```

### Terminal 2 — Mobile

```bash
cd mobile
npm start
```

- Press `i` to open iOS Simulator
- Press `a` to open Android emulator
- Scan the QR code with **Expo Go** app on a physical device

### Viewing OTPs During Development

> ⚠️ **Important**: OTP codes are **never** returned in API responses. They are printed **only** to the backend terminal.

When you request an OTP, look in Terminal 1 for:
```
========================================
📱 OTP FOR +919876543210: 482931
   Expires in 5 minutes
========================================
```

---

## Running Tests

```bash
cd backend

# Run all tests (25 tests across 2 suites)
npm test

# Run in watch mode
npm run test:watch
```

Tests use the `minyledger_test` database and clean up after each test. **No mocks** — all tests run against a real PostgreSQL instance.

---

## API Reference

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

### Authentication

#### `POST /auth/send-otp`
Generates a 6-digit OTP and prints it to the server log.

**Request:**
```json
{ "phone": "+919876543210" }
```
**Response (200):**
```json
{ "message": "OTP sent. Check the server log to view the code during development." }
```

#### `POST /auth/verify-otp`
Verifies the OTP and returns a JWT.

**Request:**
```json
{ "phone": "+919876543210", "otp": "482931" }
```
**Response (200):**
```json
{ "token": "eyJhbGci...", "userId": 1 }
```

**Error responses:**
- `400` — Invalid OTP (with `attemptsLeft` field)
- `429` — Too many attempts or OTP expired

---

### Loans 🔐 (Requires JWT)

#### `POST /loans`
Create a new loan.

**Request:**
```json
{
  "friend_name": "Rahul",
  "amount": 1500.00,
  "due_date": "2025-12-31"
}
```
**Response (201):**
```json
{
  "loan": {
    "id": 1,
    "friend_name": "Rahul",
    "amount": 1500,
    "due_date": "2025-12-31",
    "repaid": false,
    "repaid_at": null,
    "is_overdue": false,
    "created_at": "2025-10-22T..."
  }
}
```

#### `GET /loans`
List all loans for the authenticated user (newest first).

**Response (200):**
```json
{ "loans": [ ...loan objects ] }
```

#### `PATCH /loans/:id/repay`
Mark a loan as fully repaid.

**Response (200):** Updated loan object  
**Errors:** `403` (not owner), `404` (not found), `409` (already repaid)

---

### Summary 🔐 (Requires JWT)

#### `GET /summary`
Financial summary for the authenticated user.

**Response (200):**
```json
{
  "total_lent": 3500.00,
  "total_repaid": 1000.00,
  "overdue_amount": 500.00
}
```

- `total_lent` = sum of ALL loan amounts
- `total_repaid` = sum of repaid loans
- `overdue_amount` = sum of unpaid loans with `due_date < TODAY`

---

## Security Design

| Concern | Approach |
|---------|----------|
| OTP exposure | Printed to server log only, **never** in API response |
| OTP brute force | Max 3 attempts per OTP; OTP invalidated on limit |
| OTP replay | Each OTP invalidated after use or on new request |
| OTP expiry | 5-minute TTL (configurable via env) |
| JWT secrets | Environment variable, minimum 32 characters |
| Loan ownership | Every operation checks `user_id` against JWT payload |
| Decimal safety | PostgreSQL `NUMERIC(14,2)` for all monetary values |
| Credentials | `.env` files in `.gitignore`, only `.env.example` committed |

---

## Test Results

```
Test Files  2 passed (2)
Tests       25 passed (25)
Duration    ~477ms
```

### Test Coverage

| Suite | Tests |
|-------|-------|
| OTP validation (phone format, OTP format) | 4 |
| OTP send returns no code in response | 1 |
| OTP correct flow → JWT issued | 1 |
| Wrong OTP → attemptsLeft returned | 1 |
| Max attempts enforcement | 1 |
| OTP expiry | 1 |
| Previous OTP invalidated on re-send | 1 |
| Auth guard on loan endpoints | 2 |
| Loan validation (negative amount, bad date, empty name) | 3 |
| Loan CRUD (create, list per-user isolation) | 2 |
| Ownership enforcement | 1 |
| Mark as repaid | 1 |
| Duplicate repayment prevention | 1 |
| 404 on non-existent loan | 1 |
| Summary zero state | 1 |
| Summary calculation accuracy | 1 |
| Repaid loans excluded from overdue | 1 |
| Summary auth guard | 1 |

---

## Known Limitations

1. **Receipt uploads**: Not implemented (optional per the spec)
2. **Push notifications**: Out of scope
3. **Partial repayments**: Only full repayment is modelled
4. **Physical device OTP**: You must be on the same WiFi and set `EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP
5. **Production hardening**: CORS `origin: '*'` should be restricted in production; JWT secret rotation not implemented

---

## Interview Walkthrough — Key Code Sections

### 1. OTP Security (`backend/src/services/otp.service.ts`)
- `createOtp()` uses `crypto.randomInt(100000, 999999)` for cryptographically random codes
- Invalidates all previous OTPs atomically in a transaction before creating a new one
- OTP code is **only** printed to `console.log` (server terminal) — never returned in API

### 2. Decimal Safety (`backend/src/db/migrate.ts`)
- Amounts stored as `NUMERIC(14,2)` — PostgreSQL's exact decimal type, avoids floating-point errors
- Summary query uses `::TEXT` cast then `parseFloat()` in the route handler, preserving precision

### 3. Ownership Enforcement (`backend/src/routes/loans.routes.ts`)
- `PATCH /loans/:id/repay` fetches the loan and compares `loan.user_id !== req.user.userId` before allowing repayment
- Returns `403 Forbidden` (not 404) to avoid leaking existence of other users' loans... actually 404 for privacy

### 4. Summary Query (`backend/src/routes/summary.routes.ts`)
- Single SQL query with `FILTER (WHERE ...)` conditional aggregates — no N+1 queries
- `COALESCE(..., 0)` handles users with no loans returning `null`

### 5. Secure Token Storage (`mobile/src/utils/storage.ts`)
- Uses `expo-secure-store` backed by iOS Keychain / Android Keystore
- Token persists across app restarts; cleared on logout

### 6. Auto-refresh Pattern (`mobile/app/(tabs)/dashboard.tsx`)
- `useFocusEffect` re-fetches summary whenever the screen comes into focus
- Ensures dashboard is always up-to-date after adding/repaying loans on other tabs
