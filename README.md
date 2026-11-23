# 🍿 Snack Overflow — Office Pantry Management

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_18-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_18-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)](https://vitest.dev/)

**Snack Overflow** is a full-stack, concurrency-safe office pantry management application built for high-demand office environments. Employees can browse available snacks, monitor live stock levels, consume snacks, vote for their favorites, and submit new snack requests with live status tracking. Administrators have full privileges to add, edit, delete, restock, review member requests, and manage an in-app notification center.

---

## 📸 Key Features

- **🛡️ Concurrency-Safe Inventory:** Database-level atomic decrements via PostgreSQL conditional updates ensure zero race conditions and prevent negative stock under heavy simultaneous loads.
- **📥 Snack Request & Admin Approval Workflow:**
  - Members submit snack proposals with categories and explanations under **"My Requests"**.
  - Admins review, approve (setting initial stock & threshold), or decline (with mandatory explanation) under **"Snack Requests"**.
  - Atomic approval creates the inventory snack, updates request status, logs activity, and generates member notifications in a single transaction.
- **🔔 Live In-App Notification Center:** Header bell with unread badge counter, live polling, read/unread status, and bulk "mark all read" functionality.
- **👑 Role-Based Access Control:** Secure JWT authentication with strict server-side authorization separating `ADMIN` and `MEMBER` privileges.
- **📊 Real-Time SaaS Dashboard:** Dynamic KPIs (Total Snack Types, Stocked, Running Low, Out of Stock, Total Available Units) and interactive visual charts (Recharts) with clean non-overlapping layout.
- **🏆 Snack of the Week:** Deterministic calculation based on votes recorded in the trailing 7 days with a predictable tie-breaking policy.
- **🔍 Advanced Search & Server-Side Filtering:** Category filtering, status filtering (`STOCKED`, `RUNNING_LOW`, `GONE`), debounced search, sorting, and server-side pagination (12 per page).
- **🎨 Premium Visual Identity:** Thoughtfully designed with a modern SaaS aesthetic featuring a warm yellow-and-white theme (`#F5C842`, `#FFF4CC`, `#FFF9EC`), subtle shadows, rounded cards, and responsive layout for desktop, tablet, and mobile.

---

## 🏗️ Architecture & Tech Stack

```
snack-overflow/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema & constraints (Users, Snacks, Votes, Activity, Requests, Notifications)
│   │   └── seed.ts             # Deterministic seed data (40 snacks, 10 users, votes, logs)
│   ├── src/
│   │   ├── config/             # Environment & Prisma singleton
│   │   ├── controllers/        # Snack, Auth, Request & Notification business logic
│   │   ├── middleware/         # Auth, Role guard, Error handler
│   │   ├── routes/             # Express API routes (/auth, /snacks, /snack-requests, /notifications)
│   │   ├── tests/              # 42 automated tests (Vitest + Supertest)
│   │   ├── utils/              # Status calculations, Custom error classes, Slug helpers
│   │   ├── validators/         # Zod schemas for all mutations
│   │   ├── app.ts              # Express application factory
│   │   └── server.ts           # HTTP server listener
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── snacks/             # 40 authentic SVG product packshots
│   ├── src/
│   │   ├── components/         # SnackCard, Modals, Badges, Skeletons, Sidebar, NotificationCenter
│   │   ├── context/            # AuthContext (JWT token lifecycle)
│   │   ├── hooks/              # useDebounce, custom helpers
│   │   ├── layouts/            # AppLayout responsive shell
│   │   ├── pages/              # Dashboard, Inventory, My Requests, Admin Requests, Activity Log, Login
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
- **Testing:** Vitest, Supertest, PostgreSQL integration testing suite (42 / 42 passing tests).

---

## 🔒 Concurrency Control & Database Integrity

### 1. Atomic Inventory Consumption
Consumption executes inside a PostgreSQL transaction using a conditional update:
```sql
UPDATE "Snack"
SET quantity = quantity - $amount,
    "updatedAt" = NOW()
WHERE id = $id
  AND quantity >= $amount;
```
- PostgreSQL acquires an exclusive row-level lock during the conditional `UPDATE`.
- If stock is insufficient, `rowCount === 0`. The transaction immediately aborts and returns HTTP `409 Conflict` with code `INSUFFICIENT_STOCK`.

### 2. Transactional Snack Request Approval
Inside a single database transaction:
1. Verify the request exists and is still `PENDING`.
2. Check that no snack with the same name already exists in inventory (case-insensitive check). If found, return HTTP `409 Conflict` (`DUPLICATE_SNACK_NAME`).
3. Create the snack in inventory with specified quantity and low-stock threshold.
4. Record an initial restock activity trail if initial quantity > 0.
5. Update request status to `APPROVED`, recording the reviewing admin ID and review timestamp.
6. Create an in-app member notification (`REQUEST_APPROVED`).
7. Concurrency safe: simultaneous approvals are blocked from creating duplicate snacks or double-reviewing requests.

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
| `imageUrl` | String? | Nullable | SVG packshot path |
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

### `Activity`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | String | PK, CUID | Unique activity ID |
| `userId` | String | FK -> User(id) | Action actor |
| `snackId` | String | FK -> Snack(id) | Targeted snack |
| `action` | ActionType | Not Null | `CONSUMED` or `RESTOCKED` |
| `amount` | Int | Not Null | Units consumed or restocked |
| `createdAt` | DateTime | Default: now() | Activity timestamp |

### `SnackRequest`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | String | PK, CUID | Unique request ID |
| `userId` | String | FK -> User(id) | Requesting member |
| `snackName` | String | Not Null | Proposed snack name |
| `category` | Category | Not Null | Snack category |
| `reason` | String? | Nullable | Optional explanation |
| `status` | RequestStatus | Default: PENDING | `PENDING`, `APPROVED`, `DECLINED` |
| `adminId` | String? | FK -> User(id) | Reviewing administrator |
| `adminResponse` | String? | Nullable | Decline reason / review notes |
| `createdAt` | DateTime | Default: now() | Submission timestamp |
| `reviewedAt` | DateTime? | Nullable | Review timestamp |

### `Notification`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | String | PK, CUID | Unique notification ID |
| `userId` | String | FK -> User(id) | Target recipient |
| `requestId` | String? | FK -> SnackRequest(id) | Associated request |
| `title` | String | Not Null | Notification title |
| `message` | String | Not Null | Notification message |
| `type` | NotificationType | Not Null | `REQUEST_SUBMITTED`, `REQUEST_APPROVED`, `REQUEST_DECLINED` |
| `isRead` | Boolean | Default: false | Read status |
| `createdAt` | DateTime | Default: now() | Notification timestamp |

---

## 🔑 Authentication & Role Matrix

| Role | Dashboard | View Snacks | Consume | Vote | My Requests | Submit Request | Admin Requests | Approve / Decline | Activity Log |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **MEMBER** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **ADMIN**  | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

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
- `POST /snacks` *(Admin)* — Add a new snack.
- `PATCH /snacks/:id` *(Admin)* — Update snack details or threshold.
- `DELETE /snacks/:id` *(Admin)* — Delete snack.
- `POST /snacks/:id/consume` — Atomically consume snack units (`{ "amount": 1 }`).
- `POST /snacks/:id/restock` *(Admin)* — Restock snack units (`{ "amount": 10 }`).
- `POST /snacks/:id/vote` — Vote for a snack.
- `DELETE /snacks/:id/vote` — Remove authenticated user's vote.
- `GET /snacks/activity` *(Admin)* — Paginated activity audit log with action filter.

### Snack Requests
- `POST /snack-requests` — Member submits a new snack request (`{ snackName, category, reason? }`).
- `GET /snack-requests/my` — Member views their own submitted requests with filter & pagination.
- `GET /snack-requests` *(Admin)* — Admin views all submitted requests with requester details, filters, and pending counter.
- `GET /snack-requests/:id` — View single request details (Admin or owning Member only).
- `PATCH /snack-requests/:id/approve` *(Admin)* — Atomically approves request, stocks snack into inventory, and notifies member.
- `PATCH /snack-requests/:id/decline` *(Admin)* — Declines request with mandatory non-empty reason and notifies member.

### Notifications
- `GET /notifications` — Authenticated user views their notifications with unread counter.
- `PATCH /notifications/:id/read` — Mark an individual notification as read.
- `PATCH /notifications/read-all` — Mark all unread notifications as read.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (tested on v22.19.0)
- **npm**: v9+ (tested on 10.9.3)
- **PostgreSQL**: v14+ (tested on v18.7 via Homebrew on macOS)

### 1. Database Setup
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
```bash
# Terminal 1 — Backend (Port 3001)
npm run dev:backend

# Terminal 2 — Frontend (Port 5173)
npm run dev:frontend
```

Visit **http://localhost:5173** in your browser.

---

## 👥 Demo Accounts

| Role | Email | Password | Privileges |
|---|---|---|---|
| **Administrator** | `admin@snackoverflow.local` | `Admin@Snack2024` | Full pantry management, review requests, restock, view activity logs |
| **Pantry Manager** | `manager@snackoverflow.local` | `Manager@Snack2024` | Full administrative privileges |
| **Team Member** | `arjun@snackoverflow.local` | `Member@Snack2024` | Browse inventory, consume snacks, vote, submit & track requests |
| **Team Member** | `priya@snackoverflow.local` | `Member@Snack2024` | Browse inventory, consume snacks, vote, submit & track requests |

*(All 8 seeded member accounts use password: `Member@Snack2024`)*

---

## 🧪 Automated Testing

Run the full backend test suite:
```bash
cd backend
npm test
```

### Test Coverage Highlights (42 / 42 Passing)
- **Authentication (5 tests):** Valid/invalid logins, token issuance, password validation, current user fetch.
- **Snack CRUD (7 tests):** Admin can create/update/delete; Members restricted with HTTP `403`.
- **Consumption (4 tests):** Positive amounts, invalid amount validation (0 or negative rejected with HTTP `400`), insufficient stock handling (HTTP `409`).
- **Restocking (2 tests):** Admin restock capability and Member restrictions.
- **Voting (5 tests):** Voting, unvoting, and database-level duplicate prevention (`@@unique`).
- **Concurrency Control (1 test):** 10 simultaneous consume requests fired concurrently against stock = 3. Confirms exactly 3 succeed, 7 fail with HTTP 409, final stock = 0.
- **Dashboard Summary (1 test):** Stock counts, total units, and Snack of the Week.
- **Snack Requests Workflow (13 tests):**
  - Member submits a request; duplicate pending requests rejected (HTTP 409).
  - Member can view own requests; cannot view other members' requests (HTTP 403).
  - Members cannot approve or decline requests (HTTP 403).
  - Admin view with filters and pending count.
  - Decline requires a non-empty reason (HTTP 400); records decline reason and notifies member.
  - Approval atomically creates snack, updates status to APPROVED, and notifies member.
  - Reviewed requests cannot be reviewed again (HTTP 409).
  - Two simultaneous approvals cannot create duplicate snacks.
  - Approval cannot create a snack if a snack with the same name already exists in inventory (HTTP 409).
- **Notification Management (4 tests):**
  - User views notifications with live unread counter.
  - Users cannot mark another user's notifications as read (HTTP 403).
  - Marking single notification as read updates unread counter.
  - Bulk "mark all as read" resets unread counter to 0.

---

## 📐 System Design Notes & Scaling Analysis

### 1. Key Architectural Decisions
- **Database-Level Atomic Conditional Decrements:** Rather than relying on application-level locks or separate Redis caches for inventory count, we leverage PostgreSQL's conditional row update: `UPDATE "Snack" SET quantity = quantity - $amount WHERE id = $id AND quantity >= $amount`. This provides strict ACID guarantees, eliminates race conditions under concurrent requests, and prevents negative inventory without distributed locking overhead.
- **Dynamic Derived State:** Stock status (`STOCKED`, `RUNNING_LOW`, `GONE`) is computed dynamically based on the current `quantity` and `lowStockThreshold`. By avoiding storing stock status as a static column, we eliminate data desynchronization, stale caches, and redundant write operations.
- **Local Packaging Packshot Architecture:** Instead of depending on third-party image CDNs (which suffer from rate-limiting, referrer policies, and CORS blocks), all 40+ snack packshots are custom-designed SVGs hosted locally. This ensures 100% availability, instant load times, zero external network calls, and crisp rendering on high-DPI displays.
- **Transactional Approval & Decline Workflows:** Snack request reviews execute inside PostgreSQL transactions (`prisma.$transaction`). An approval creates the inventory snack, updates request state, logs restock activity, and publishes a member notification atomically, ensuring no partial failure states.

### 2. Trade-offs
- **PostgreSQL Row Locks vs. In-Memory Queue (Redis/RabbitMQ):**
  - *Trade-off:* We prioritized 100% data correctness and simplicity by using PostgreSQL row-level locks rather than introducing an in-memory queue.
  - *Context:* For office pantry scales (hundreds of requests per minute), Postgres handles requests with single-digit millisecond latency. The trade-off is that extreme bursts on a single row cause lock queuing.
- **Client Polling vs. WebSockets for Notifications:**
  - *Trade-off:* We chose periodic auto-polling (10-second intervals via TanStack Query) over WebSockets.
  - *Context:* Polling keeps the backend completely stateless, avoiding sticky sessions, WebSocket connection management, and socket reconnection logic while delivering near-instant updates for standard pantry usage.
- **Composite Unique Constraints vs. Soft-Checking:**
  - *Trade-off:* We enforce vote uniqueness with `@@unique([userId, snackId])` and pending request uniqueness with database-level checks. This guarantees that duplicate votes can never be inserted even if frontend or backend validations were bypassed.

### 3. What Would Break First at 100× the Scale (and How to Scale It)

| Bottleneck | What Breaks at 100× Scale | Failure Mode | Scaling Remedy |
|---|---|---|---|
| **Hot Row Lock Contention** | 10,000+ employees simultaneously consuming the last 10 units of a trending snack. | High row-lock wait queues in PostgreSQL, transaction timeout errors, and connection pool exhaustion. | Introduce a **Redis distributed counter** with atomic Lua scripts (`DECRBY`) to absorb the traffic burst, persisting consumption events to PostgreSQL asynchronously via a **BullMQ / Kafka** write-behind queue. |
| **Database Connection Limits** | Hundreds of Express server instances opening direct pooled connections. | `FATAL: remaining connection slots are reserved for non-superuser connections`. | Deploy **PgBouncer** in transaction pooling mode in front of PostgreSQL, reducing database connection footprint by 90%+. |
| **Read Query Load on Inventory** | Thousands of concurrent users loading `/snacks` and `/snacks/summary`. | Primary database CPU spikes from repeated aggregation queries. | Add **PostgreSQL Read Replicas** for read queries (`GET /snacks`, `/snacks/popular`) and cache catalog responses in **Redis** with TTL invalidation on mutations. |
| **HTTP Polling Overhead** | 10,000 connected clients polling `/notifications` every 10s = 1,000 req/sec continuous load. | Server CPU and database read saturation just checking for empty notification changes. | Migrate from client polling to **Server-Sent Events (SSE)** or **WebSockets** backed by **Redis Pub/Sub** for push-based notification delivery. |
| **Leaderboard / Aggregation Queries** | Dynamic calculation of "Snack of the Week" aggregating trailing 7 days of votes on every request. | Slow sequential table scans as the `Vote` table grows into millions of rows. | Use a **Redis Sorted Set** (`ZINCRBY`) for real-time weekly vote tracking, or create a PostgreSQL **Materialized View** refreshed periodically via `pg_cron`. |
