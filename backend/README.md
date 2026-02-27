# NEB +2 School ERP

Production-oriented School Management ERP for Nepal NEB (+2), implemented as a modular NestJS backend with React web and Expo mobile clients.

## Architecture

### Monorepo layout

- `backend/`: NestJS API, Prisma schema/migrations, queue workers, seed data
- `frontend/`: React + Vite web app
- `mobile/`: Expo Router mobile app
- `redis/`: local redis data/config artifacts
- `docker-compose.yml`: local infra (MySQL, replica, Redis, MinIO)
- `school_management_schema.sql`: legacy/reference SQL schema document

### Backend architecture

- Framework: NestJS 11
- API shape: `/api/v1/*` with URI versioning
- Docs: Swagger at `/api/docs` (non-production only)
- Data layer: Prisma + MySQL/MariaDB adapter
- Caching/queues: Redis + BullMQ
- Logging: `nestjs-pino`
- Storage: Cloudinary-backed `StorageService`
- Auth: JWT access token + server-side refresh token rotation

### Core backend modules

- `auth`: login, refresh, profile, password change, avatar upload
- `schools`, `users`: school and user management
- `academic`: years, terms, grades, subjects
- `students`: students, enrollment, parent linking
- `exams`: exam lifecycle, marks entry, NEB grading utils
- `board-exam`: board exam registration and symbol number management
- `attendance`: daily attendance and student summary
- `finance`: fee structures, invoices, payments, idempotency
- `reports`: report generation and download links
- `notifications`: in-app + websocket notification flow
- `admin`: dead-letter queue admin endpoints (super admin)
- `health`: liveness/readiness checks

## Setup

### Prerequisites

- Node.js `20` (see `.nvmrc`)
- pnpm (recommended for backend/frontend)
- Docker Desktop (for local DB/Redis)

### 1) Start infrastructure

From repository root:

```bash
docker compose up -d mysql mysql-replica redis
```

Optional local object storage (currently not used by backend `StorageService`):

```bash
docker compose up -d minio minio-init
```

### 2) Backend setup

```bash
cd backend
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm start:dev
```

Backend runs at `http://localhost:3000` by default.

### 3) Frontend setup

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend runs at `http://localhost:5173` by default.

### 4) Mobile setup

```bash
cd mobile
npm install
npm run start
```

## Environment Matrix

### Backend (`backend/.env`)

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | - | Primary DB connection |
| `DATABASE_REPLICA_URL` | No | falls back to `DATABASE_URL` | Read replica connection |
| `REDIS_HOST` | No | `localhost` | Redis host |
| `REDIS_PORT` | No | `6379` | Redis port |
| `JWT_SECRET` | Yes | - | Access token signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | No | `15m` | Access token TTL |
| `JWT_REFRESH_SECRET` | Yes | - | Refresh signing secret (min 32 chars) |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token TTL |
| `CLOUDINARY_CLOUD_NAME` | Yes | - | Cloudinary config |
| `CLOUDINARY_API_KEY` | Yes | - | Cloudinary config |
| `CLOUDINARY_API_SECRET` | Yes | - | Cloudinary config |
| `PORT` | No | `3000` | API port |
| `NODE_ENV` | No | `development` | `development`, `production`, `test` |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Comma-separated allowed origins |
| `THROTTLE_TTL` | No | `60000` | Rate limit window (ms) |
| `THROTTLE_LIMIT` | No | `60` | Requests per TTL |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | No | `http://localhost:3000/api/v1` | REST API base |
| `VITE_WS_URL` | No | `http://localhost:3000` | Notifications websocket base |
| `VITE_CLOUDINARY_CLOUD_NAME` | No | fallback in code | Used for profile image URL construction |

### Mobile (`mobile/.env` or shell env)

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | No | `http://localhost:3000/api/v1` | API base URL |
| `EXPO_PUBLIC_WS_URL` | No | `http://localhost:3000` | Websocket URL |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | No | empty | Expo EAS project ID |

## Database and Migration Strategy

### Source of truth

- Canonical schema: `backend/prisma/schema.prisma`
- Canonical migration history: `backend/prisma/migrations/*`
- Seed source: `backend/prisma/seed.ts`

`school_management_schema.sql` is treated as a reference/analysis artifact and should not be considered the runtime schema source.

### Local migration workflow

1. Update `schema.prisma`.
2. Generate a named migration:

```bash
pnpm prisma migrate dev --name <change_name>
```

3. Regenerate Prisma client:

```bash
pnpm prisma generate
```

4. Run seed if needed:

```bash
pnpm prisma:seed
```

### Deployment migration workflow

- Build migration artifacts in CI from committed `prisma/migrations`.
- Apply migrations in target environment before app rollout.
- Back up DB before destructive migrations.
- Rollback strategy: restore from backup and deploy previous app version.

### Data safety guidelines

- Prefer additive migrations first (`nullable`, backfill, then constrain).
- Avoid manual edits to generated migration SQL after merge.
- Treat finance and exam tables as high-risk for schema changes; test in staging with production-like data.

## Role Permissions (Application Intent)

Role checks are enforced by `JwtAuthGuard` + `RolesGuard` + `@RequireRoles(...)`.

| Role | Primary capabilities |
| --- | --- |
| `SUPER_ADMIN` | Cross-school administration, school management, users, full academics/finance/exams/reports/admin |
| `ADMIN` | School-level operational control: users, students, academics, exams, finance, reports, board exam, attendance |
| `TEACHER` | Student/exam workflows, marks entry, attendance operations, selected reports |
| `ACCOUNTANT` | Finance operations (fee structures, invoices, payments) and financial reporting |
| `PARENT` | Intended read access to linked child academic/attendance/finance data |
| `STUDENT` | Intended read access to own exam/report data |

Web menu-level access is mapped in `frontend/src/utils/role-permissions.ts`.

## Nepal / NEB Domain Assumptions

The implementation assumes the following Nepal NEB +2 constraints:

- Multi-tenant schools with strict school-level data isolation.
- Grade model targets higher secondary (`11`, `12`) with stream/section.
- Student DOB supports both AD (`dob`) and BS (`dobBsYear`, `dobBsMonth`, `dobBsDay`).
- Board exam registration is separate and symbol numbers are managed per academic year.
- NEB grading includes:
  - theory pass threshold at 35 percent
  - practical pass threshold at 40 percent
  - NG handling for failed components
  - credit-hour-weighted GPA and classification logic
- Optional subject GPA treatment follows NEB-oriented uplift logic in grading util.
- Finance supports Nepal payment methods including `ESEWA` and `KHALTI`.
- School documents/reports are produced as PDF jobs through queue workers.

## API and Operations

### Runtime endpoints

- Base API: `http://localhost:3000/api/v1`
- Swagger docs: `http://localhost:3000/api/docs` (non-production)
- Health: `GET /api/v1/health`

### Queue and report pipeline

- Queue backend: BullMQ on Redis
- Report worker: `pdf-generation` processor
- Failures: retained for DLQ-style operational handling

## Useful Commands

From `backend/`:

```bash
# Start dev server
pnpm start:dev

# Lint and format
pnpm lint
pnpm format

# Tests
pnpm test
pnpm test:e2e
pnpm test:cov

# Prisma
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm prisma:studio
```

## Seeded Demo Credentials (local seed)

- `superadmin@sms.edu.np / SuperAdmin@123`
- `admin@demo.edu.np / Admin@123`
- `accountant@demo.edu.np / Accountant@123`
- `teacher@demo.edu.np / Teacher@123`

Use only for local/dev environments.
