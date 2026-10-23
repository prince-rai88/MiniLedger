<div align="center">

# 💰 MiniLedger

**A production-ready full-stack ledger app for tracking loans to friends.**  
Built with high-precision accounting principles, strict security guarantees, and a sleek modern mobile & web interface.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-0.79-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK-53-black?logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?logo=express&logoColor=black)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vitest](https://img.shields.io/badge/Vitest-25_Passed-729B1B?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?logo=zod&logoColor=white)](https://zod.dev/)

[Architecture](#-architecture) • [Quickstart](#-quick-start) • [API Docs](#-api-reference) • [Security](#-security-design) • [Testing](#-test-suite)

</div>

---

## 🌟 Key Highlights

- 🔐 **Mock OTP + JWT Authentication** — Cryptographically secure 6-digit OTPs with rate-limiting (3 attempts), 5-min TTL, atomic invalidation, and zero credential leakage (OTP printed exclusively to server terminal).
- 💸 **Robust Financial Ledger** — Exact decimal arithmetic backed by PostgreSQL `NUMERIC(14,2)` to prevent floating-point errors.
- 🛡️ **Zero-Trust Ownership Guard** — Strict tenant isolation ensuring users can only read, create, or repay their own loans.
- ⚡ **High-Performance Aggregates** — Single-query financial rollups using PostgreSQL conditional `FILTER (WHERE ...)` clauses.
- 📱 **Cross-Platform Interface** — Beautiful dark-mode UI crafted with Expo Router, running seamlessly across iOS, Android, and Web browsers.
- 🧪 **100% Real DB Test Coverage** — 25 Vitest integration tests running against an isolated PostgreSQL instance (no mock databases).

---

## 🏗 Architecture

```
                             ┌──────────────────────────────────────┐
                             │    Expo Client (iOS / Android / Web) │
                             │  - File-based Expo Router            │
                             │  - Dynamic Storage Adapter           │
                             │  - Token-injected Axios Interceptor  │
                             └──────────────────┬───────────────────┘
                                                │  JSON / Bearer JWT
                                                ▼
                             ┌──────────────────────────────────────┐
                             │       Express REST API (TS)          │
                             │  - Zod Request Validation            │
                             │  - Centralized Error Handler         │
                             │  - Auth & Ownership Middlewares      │
                             └──────────────────┬───────────────────┘
                                                │  Connection Pool (pg)
                                                ▼
                             ┌──────────────────────────────────────┐
                             │      PostgreSQL Database             │
                             │  - users (id, phone, created_at)     │
                             │  - otps (phone, code, expires_at)    │
                             │  - loans (friend_name, amount, due)  │
                             └──────────────────────────────────────┘
```

---

## 📦 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Mobile & Web** | React Native, Expo SDK 53, TypeScript | Cross-platform client with universal navigation |
| **Styling & Icons** | Custom Dark Theme Design System | Curated high-contrast palette with micro-animations |
| **Storage** | Expo SecureStore + AsyncStorage | Keychain/Keystore on mobile, safe local fallback on Web |
| **Backend** | Node.js, Express, TypeScript | Type-safe REST API server with robust error middleware |
| **Database** | PostgreSQL (`pg` pool) | Relational persistence with ACID compliance & auto-migrations |
| **Validation** | Zod | Runtime schema validation on all incoming payloads |
| **Security** | JSON Web Tokens (`jsonwebtoken`), Node Crypto | Stateless session management & crypto-random OTPs |
| **Testing** | Vitest, Supertest | Fast integration test suite against live PostgreSQL |

---

## 📂 Project Structure

```bash
MiniLedger/
├── backend/                         # Express & PostgreSQL API
│   ├── src/
│   │   ├── db/
│   │   │   ├── pool.ts              # PostgreSQL connection pool singleton
│   │   │   └── migrate.ts           # Schema migration & auto-indexing
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   # Bearer JWT verification guard
│   │   │   └── error.middleware.ts  # Zod & HTTP error interceptor
│   │   ├── routes/
│   │   │   ├── auth.routes.ts       # /auth/send-otp & /auth/verify-otp
│   │   │   ├── loans.routes.ts      # /loans CRUD with ownership checks
│   │   │   └── summary.routes.ts    # /summary aggregate rollups
│   │   ├── services/
│   │   │   ├── otp.service.ts       # OTP generation, verification & throttling
│   │   │   ├── jwt.service.ts       # Token signing & verification
│   │   │   └── validation.ts        # Declarative Zod schemas
│   │   ├── tests/
│   │   │   ├── otp.test.ts          # Authentication test suite
│   │   │   ├── loans.test.ts        # Ledger & ownership test suite
│   │   │   └── helpers.ts           # Test DB lifecycle management
│   │   └── index.ts                 # Express bootstrap & healthcheck
│   ├── vitest.config.ts             # Vitest test configuration
│   └── package.json
│
└── mobile/                          # Universal Expo Client
    ├── app/                         # Expo Router App Directory
    │   ├── _layout.tsx              # Root Stack navigation container
    │   ├── index.tsx                # Dynamic auth entry router
    │   ├── login.tsx                # Phone & OTP verification screen
    │   ├── add-loan.tsx             # Modal form for recording new loans
    │   └── (tabs)/
    │       ├── _layout.tsx          # Tab navigator (Dashboard / Loans)
    │       ├── dashboard.tsx        # Financial health metrics & actions
    │       └── loans.tsx            # Filterable loan list with repay action
    ├── src/
    │   ├── components/              # Modular UI components (Input, Button, LoanCard)
    │   ├── services/api.ts          # Axios client with bearer token injection
    │   └── utils/
    │       ├── storage.ts           # Cross-platform secure token storage
    │       └── theme.ts             # Typography, colors, and layout tokens
    └── package.json
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (`node --version`)
- **PostgreSQL**: Running locally (`pg_isready`)
- **Package Manager**: npm or yarn

### 2. Database Initialization
Create your development and test databases:
```bash
psql postgres -c "CREATE DATABASE minyledger;"
psql postgres -c "CREATE DATABASE minyledger_test;"
```

### 3. Backend Setup
```bash
cd backend
npm install

# Copy environment configuration
cp .env.example .env
```

Ensure `.env` matches your local database settings:
```ini
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=minyledger
DB_USER=your_postgres_user
DB_PASSWORD=

JWT_SECRET=super_secret_minyledger_dev_key_32chars_min
JWT_EXPIRES_IN=7d
OTP_EXPIRES_IN_MINUTES=5
OTP_MAX_ATTEMPTS=3
```

Start the API with hot reloading:
```bash
npm run dev
```
> The server automatically applies migrations on boot and prints:  
> `✅ Database migrations completed`  
> `🚀 MiniLedger API running on http://localhost:3000`

### 4. Mobile & Web Client Setup
In a second terminal:
```bash
cd mobile
npm install

# Copy environment configuration
cp .env.example .env
```

Start Expo Dev Server:
```bash
npm start
```

| Key | Platform | How it works |
| :---: | :--- | :--- |
| **`w`** | **Web Browser** | Opens instantly in your browser at `http://localhost:8081` |
| **`i`** | **iOS Simulator** | Boots default iOS Simulator (requires Xcode) |
| **`a`** | **Android Emulator**| Boots configured Android Virtual Device |
| **QR** | **Expo Go** | Scan QR code with iOS Camera or Expo Go Android app |

---

## 🔑 Authentication Workflow

1. Enter your phone number in the app (e.g. `+919876543210`).
2. Press **Send OTP**.
3. Observe Terminal 1 (Backend dev server) to see the generated code:
```text
========================================
📱 OTP FOR +919876543210: 844913
   Expires in 5 minutes
========================================
```
4. Enter the 6-digit code into the mobile app to verify and receive your JWT.

---

## 📡 API Reference

All protected endpoints require the header:
```http
Authorization: Bearer <jwt_token>
```

### Auth Endpoints

#### `POST /auth/send-otp`
Generates a cryptographically random 6-digit OTP, saves it to PostgreSQL, and logs it to the terminal.
```json
// Request
{ "phone": "+919876543210" }

// Response (200 OK)
{ "message": "OTP sent. Check the server log to view the code during development." }
```

#### `POST /auth/verify-otp`
Validates the OTP, marks it verified, and returns a signed JWT.
```json
// Request
{ "phone": "+919876543210", "otp": "844913" }

// Response (200 OK)
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "userId": 1
}
```

---

### Loan Endpoints

#### `POST /loans`
Creates a new loan associated with the authenticated user.
```json
// Request
{
  "friend_name": "Rahul Verma",
  "amount": 2500.00,
  "due_date": "2026-12-31"
}

// Response (201 Created)
{
  "loan": {
    "id": 1,
    "user_id": 1,
    "friend_name": "Rahul Verma",
    "amount": 2500,
    "due_date": "2026-12-31",
    "repaid": false,
    "repaid_at": null,
    "created_at": "2026-10-23T10:00:00.000Z",
    "is_overdue": false
  }
}
```

#### `GET /loans`
Retrieves all loans for the authenticated user, ordered by creation date descending.
```json
// Response (200 OK)
{
  "loans": [
    {
      "id": 1,
      "friend_name": "Rahul Verma",
      "amount": 2500,
      "due_date": "2026-12-31",
      "repaid": false,
      "repaid_at": null,
      "is_overdue": false
    }
  ]
}
```

#### `PATCH /loans/:id/repay`
Marks an active loan as repaid. Enforces that only the creator can repay, and rejects duplicate repayments.
```json
// Response (200 OK)
{
  "loan": {
    "id": 1,
    "repaid": true,
    "repaid_at": "2026-10-23T11:00:00.000Z"
  }
}
```
*HTTP Error Codes: `404 Not Found` (non-existent or belongs to another user), `409 Conflict` (already repaid).*

---

### Financial Summary

#### `GET /summary`
Returns aggregated ledger totals computed directly inside PostgreSQL:
```json
// Response (200 OK)
{
  "total_lent": 7500.00,
  "total_repaid": 2500.00,
  "overdue_amount": 1000.00
}
```

---

## 🔒 Security Design

| Vector | Defense Mechanism |
| :--- | :--- |
| **OTP Leakage** | OTP values are **never** returned in any HTTP response payload; written only to `stdout`. |
| **Brute Force Protection** | Max **3 verification attempts** per OTP. On reaching the limit, the OTP is burned and returns `429 Too Many Requests`. |
| **Replay Attacks** | Invalidation occurs atomically; re-requesting an OTP invalidates previous active codes for that phone. |
| **Token Safety** | Handled natively via iOS Keychain and Android Keystore using `expo-secure-store`, with fallback for web. |
| **Decimal Precision** | Uses PostgreSQL exact `NUMERIC(14,2)` — zero JavaScript floating-point roundoff issues. |
| **Data Isolation** | Multi-tenant isolation at the query level (`WHERE user_id = $1`). Foreign loans return `404` to prevent ID enumeration. |

---

## 🧪 Test Suite

All tests execute against live PostgreSQL database instances (`minyledger_test`) without mocks.

```bash
cd backend
npm test
```

### Test Coverage Summary:
```text
 ✓ src/tests/otp.test.ts (10 tests)
 ✓ src/tests/loans.test.ts (15 tests)

 Test Files  2 passed (2)
      Tests  25 passed (25)
   Duration  ~500ms
```

- **Authentication Suite (10 tests):** E.164 phone formatting, OTP generation, 5-minute expiry, 3-attempt lockouts, previous code invalidation, and response sanitation.
- **Ledger & Ownership Suite (15 tests):** Loan creation validation, decimal handling, user data isolation, repay state transitions, duplicate repay prevention, and accurate overdue aggregate computation.

---

## 📄 License

Distributed under the MIT License. Built with ❤️ for the Full-Stack Engineering Internship Assignment.
