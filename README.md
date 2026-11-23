# 🍿 Snack Overflow — Office Pantry Management

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_18-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_18-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)](https://vitest.dev/)

**Snack Overflow** is a full-stack, concurrency-safe office pantry management application built for high-demand office environments. Employees can browse available snacks, monitor live stock levels, consume snacks, and vote for their favorites. Administrators have full privileges to add, edit, delete, and restock snacks, along with an audit trail of all pantry activity.

---

## 📸 Key Features

- **🛡️ Concurrency-Safe Inventory:** Database-level atomic decrements via PostgreSQL conditional updates ensure zero race conditions and prevent negative stock under heavy simultaneous loads.
- **👑 Role-Based Access Control:** Secure JWT authentication with strict server-side authorization separating `ADMIN` and `MEMBER` privileges.
- **📊 Real-Time SaaS Dashboard:** Dynamic KPIs (Total Snack Types, Stocked, Running Low, Out of Stock, Total Available Units) and interactive visual charts (Recharts).
- **🏆 Snack of the Week:** Deterministic calculation based on votes recorded in the trailing 7 days with a predictable tie-breaking policy.
- **🔍 Advanced Search & Server-Side Filtering:** Category filtering, status filtering (`STOCKED`, `RUNNING_LOW`, `GONE`), debounced search, sorting, and server-side pagination.
- **🎨 Premium Visual Identity:** Thoughtfully designed with a modern SaaS aesthetic featuring a warm yellow-and-white theme (`#F5C842`, `#FFF4CC`, `#FFF9EC`), subtle shadows, rounded cards, and responsive layout for desktop, tablet, and mobile.

---

## 🏗️ Architecture & Tech Stack

```
snack-overflow/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema & constraints
│   │   ├── seed.ts             # Deterministic seed data (40 snacks, 10 users, votes, logs)
│   ├── src/
│   │   ├── config/             # Environment & Prisma singleton
│   │   ├── controllers/        # Snack & Auth business logic
│   │   ├── middleware/         # Auth, Role guard, Error handler
│   │   ├── routes/             # Express API routes
│   │   ├── tests/              # 25 automated tests (Vitest + Supertest)
│   │   ├── utils/              # Status calculations, Custom error classes
│   │   ├── validators/         # Zod schemas for all mutations
│   │   ├── app.ts              # Express application factory
│   │   └── server.ts           # HTTP server listener
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # SnackCard, Modals, Badges, Skeletons, Sidebar
│   │   ├── context/            # AuthContext (JWT token lifecycle)
│   │   ├── hooks/              # useDebounce, custom helpers
│   │   ├── layouts/            # AppLayout responsive shell
│   │   ├── pages/              # Dashboard, Inventory, Activity Log, Login
│   │   ├── services/           # Typed API service client
│   │   ├── types/              # Domain TypeScript types
│   │   ├── utils/              # UI formatters & status helpers
│   │   ├── App.tsx             # Routing & Protected routes
│   │   └── main.tsx            # Entry point & QueryClientProvider
│   └── package.json
└── README.md
```

### Technology Highlights
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query v5, React Hook Form, Zod, Lucide React, Recharts, React Hot Toast.
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, JWT, bcryptjs, Zod, Helmet, CORS, Express Rate Limit.
- **Database:** PostgreSQL 18 with relational foreign keys, indexes, and composite unique constraints.
- **Testing:** Vitest, Supertest, PostgreSQL integration testing suite.

---

## 🔒 Concurrency Control & Database Integrity

### The Problem
When multiple users simultaneously attempt to consume the last units of a popular snack, naive "read-modify-write" sequences in application code create race conditions:
```
User A: Reads quantity = 1
User B: Reads quantity = 1
User A: 1 >= 1 -> Sets quantity = 0
User B: 1 >= 1 -> Sets quantity = -1 (INCORRECT: Inventory deficit!)
```

### The Solution: Database-Level Atomic Decrement
In `backend/src/controllers/snack.controller.ts`, consumption executes inside a PostgreSQL transaction using a conditional update:

```sql
UPDATE "Snack"
SET quantity = quantity - $amount,
    "updatedAt" = NOW()
WHERE id = $id
  AND quantity >= $amount;
```

1. PostgreSQL acquires an exclusive row-level lock during the conditional `UPDATE`.
2. The `WHERE quantity >= $amount` check is evaluated atomically by the database engine.
3. If sufficient stock exists, the row is decremented and `rowCount === 1`. The activity log is inserted in the **same database transaction**.
4. If stock is insufficient, `rowCount === 0`. The transaction immediately aborts and throws an `InsufficientStockError`, returning HTTP `409 Conflict` with code `INSUFFICIENT_STOCK`.
5. Under zero conditions can `quantity` drop below `0`.

### Concurrency Benchmark Test
The automated test in `backend/src/tests/api.test.ts` proves correctness under contention:
- **Scenario:** 10 concurrent requests fired simultaneously using `Promise.all` targeting a snack with `quantity: 3`.
- **Result:**
  - Exactly **3 requests succeed** with HTTP `200`.
  - Exactly **7 requests fail** with HTTP `409 Conflict`.
  - Final database quantity is **0** (never negative).
  - Exactly **3 activity log records** are inserted.

---

## 🗄️ Relational Database Schema

### `User`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | String | PK, CUID | Unique user ID |
| `name` | String | Not Null | User full name |
| `email` | String | Unique, Not Null | Login email |
| `password` | String | Not Null | bcrypt hashed password |
| `role` | Role | Default: MEMBER | `ADMIN` or `MEMBER` |
| `createdAt` | DateTime | Default: now() | Creation timestamp |
| `updatedAt` | DateTime | UpdatedAt | Last update |

### `Snack`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | String | PK, CUID | Unique snack ID |
| `name` | String | Unique, Not Null | Unique snack name |
| `category` | Category | Not Null | `SWEET`, `SAVOURY`, `DRINK`, `HEALTHY_ISH` |
| `quantity` | Int | Not Null | Current stock (>= 0) |
| `lowStockThreshold`| Int | Default: 5 | Alert threshold |
| `imageUrl` | String? | Nullable | Optional image URL |
| `createdAt` | DateTime | Default: now() | Creation timestamp |
| `updatedAt` | DateTime | UpdatedAt | Last update |

### `Vote`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | String | PK, CUID | Unique vote ID |
| `userId` | String | FK -> User(id) | Voter |
| `snackId` | String | FK -> Snack(id) | Voted snack |
| `createdAt` | DateTime | Default: now() | Vote timestamp |

> **Composite Unique Constraint:** `@@unique([userId, snackId])`  
> Prevents duplicate voting at the database engine level.

### `Activity`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | String | PK, CUID | Unique activity ID |
| `userId` | String | FK -> User(id) | Action actor |
| `snackId` | String | FK -> Snack(id) | Targeted snack |
| `action` | ActionType | Not Null | `CONSUMED` or `RESTOCKED` |
| `amount` | Int | Not Null | Units consumed or restocked |
| `createdAt` | DateTime | Default: now() | Activity timestamp |

### Derived Stock Status (Computed Dynamically)
Stock status is never stored as a static column to prevent drift:
- **`STOCKED`**: `quantity > lowStockThreshold`
- **`RUNNING_LOW`**: `quantity > 0 && quantity <= lowStockThreshold`
- **`GONE`**: `quantity === 0`

---

## 🏆 Snack of the Week Algorithm

The "Snack of the Week" is determined dynamically by querying votes cast during the previous 7 days:
1. Filter votes where `createdAt >= NOW() - INTERVAL '7 days'`.
2. Group by `snackId` and count total weekly votes.
3. Sort in descending order of votes.
4. **Deterministic Tie-Breaking Policy:** In case of a tie between two or more snacks with the exact same number of weekly votes, the winner is deterministically chosen as the snack with the **earliest creation date** (`createdAt ASC`).
5. **Fallback:** If no votes were cast in the past 7 days, the system falls back to the all-time most voted snack.

---

## 🔑 Authentication & Authorization

| Role | Dashboard | View Snacks | Consume | Vote / Unvote | Add Snack | Edit Snack | Delete Snack | Restock | Activity Log |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **MEMBER** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **ADMIN**  | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

- Passwords hashed using `bcrypt` (salt rounds: 12).
- Authenticated requests pass `Authorization: Bearer <JWT_TOKEN>`.
- Backend middleware (`requireAdmin`) strictly checks role on every administrative endpoint. Attempted access by a Member returns HTTP `403 Forbidden`.

---

## 📡 REST API Reference

### Authentication
- `POST /auth/login` — Sign in and receive JWT token + user details.
- `GET /auth/me` — Get authenticated user details.

### Snacks & Inventory
- `GET /snacks` — List snacks with server-side filters: `category`, `status`, `search`, `page`, `limit`, `sort`.
- `GET /snacks/:id` — Get snack details, derived status, and vote status.
- `GET /snacks/summary` — KPI summary (totalTypes, stocked, runningLow, gone, totalUnits, snackOfTheWeek).
- `GET /snacks/popular` — Top 5 most-voted snacks.
- `POST /snacks` *(Admin)* — Add a new snack (validates name, category, quantity, threshold).
- `PATCH /snacks/:id` *(Admin)* — Update snack details or threshold.
- `DELETE /snacks/:id` *(Admin)* — Delete snack (cascades associated records safely).
- `POST /snacks/:id/consume` — Atomically consume snack units (`{ "amount": 1 }`).
- `POST /snacks/:id/restock` *(Admin)* — Restock snack units (`{ "amount": 10 }`).

### Voting & Activity
- `POST /snacks/:id/vote` — Vote for a snack (composite unique constraint enforced).
- `DELETE /snacks/:id/vote` — Remove authenticated user's vote.
- `GET /snacks/activity` *(Admin)* — Paginated activity audit log with action filter.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (tested on v22.19.0)
- **npm**: v9+ (tested on 10.9.3)
- **PostgreSQL**: v14+ (tested on v18.7 via Homebrew on macOS)

### 1. Database Setup
Ensure PostgreSQL is running and create the databases:
```bash
createdb snack_overflow
createdb snack_overflow_test
```

### 2. Environment Configuration
Backend `.env` (`backend/.env`):
```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/snack_overflow"
TEST_DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/snack_overflow_test"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

Frontend `.env` (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3001
```

### 3. Install Dependencies & Seed
```bash
# Backend setup
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed

# Frontend setup
cd ../frontend
npm install
```

### 4. Run Applications
In two separate terminal windows:

**Backend (Port 3001):**
```bash
cd backend
npm run dev
# or npm start for production build
```

**Frontend (Port 5173):**
```bash
cd frontend
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 👥 Demo Accounts

| Role | Email | Password | Privileges |
|---|---|---|---|
| **Administrator** | `admin@snackoverflow.local` | `Admin@Snack2024` | Full pantry management, add/edit/delete/restock, view activity logs |
| **Pantry Manager** | `manager@snackoverflow.local` | `Manager@Snack2024` | Full administrative privileges |
| **Team Member** | `arjun@snackoverflow.local` | `Member@Snack2024` | Browse inventory, consume snacks, vote for favorites |
| **Team Member** | `priya@snackoverflow.local` | `Member@Snack2024` | Browse inventory, consume snacks, vote for favorites |

*(All 8 seeded member accounts use password: `Member@Snack2024`)*

---

## 🧪 Automated Testing

Run the full backend test suite:
```bash
cd backend
npm test
```

### Test Coverage Highlights (25 / 25 Passing)
- **Authentication:** Valid/invalid logins, token issuance, password validation, current user fetch.
- **Role Permissions:** Admin can create/update/delete/restock; Members rejected with HTTP `403`.
- **Consumption:** Positive amounts, invalid amount validation (0 or negative rejected with HTTP `400`), insufficient stock handling (HTTP `409`).
- **Voting:** Voting, unvoting, and database-level duplicate prevention (`@@unique`).
- **Concurrency Control:** 10 simultaneous consume requests fired concurrently against stock = 3. Confirms exactly 3 succeed, 7 fail with HTTP 409, final stock = 0, and exactly 3 activities recorded.
- **Dashboard:** Accurate computation of stock counts, total units, and Snack of the Week.

---

## 🎨 Design System

| Element | Hex Code | Purpose |
|---|---|---|
| **Primary Yellow** | `#F5C842` | Primary buttons, active states, key highlights |
| **Soft Yellow** | `#FFF4CC` | Card hover backgrounds, secondary badges |
| **Warm Background** | `#FFF9EC` | Application background |
| **White** | `#FFFFFF` | Cards, table containers, inputs |
| **Primary Text** | `#252525` | Headings, titles, main body text |
| **Secondary Text** | `#777777` | Metadata, subtitles, timestamps |
| **Border** | `#EEEEEE` | Card borders, dividers, table rules |
| **Stock Green** | `#22C55E` | STOCKED badge (`> threshold`) |
| **Stock Orange** | `#F97316` | RUNNING_LOW badge (`<= threshold`) |
| **Stock Red** | `#EF4444` | GONE badge (`quantity = 0`) & error states |
