# Context: Project Setup, Folder Structure & DevOps

## Domain: NEB +2 School Management ERP

This document defines the exact project bootstrapping steps, folder conventions, environment configuration, Docker setup, and dependency manifest. The agent MUST follow these instructions when initializing the project or adding new modules.

### 🚨 Strict Setup Rules

1. **Monorepo Structure:** This is a single-repo project with backend (`/backend`) and frontend (`/frontend`) directories at the root. Do NOT use Nx, Turborepo, or Lerna — a simple folder split is sufficient.
2. **NestJS CLI:** The backend MUST be scaffolded using `@nestjs/cli`. Always use the NestJS module generator (`nest g module`, `nest g service`, etc.) to maintain consistent structure.
3. **Package Manager:** Use `pnpm` exclusively. Do NOT use `npm` or `yarn`. Lock files must be committed.
4. **Node Version:** Require Node.js 20 LTS. Include an `.nvmrc` file with `20` at the project root.
5. **Strict TypeScript:** Both backend and frontend MUST use `"strict": true` in `tsconfig.json`. NEVER use `any` except in explicitly typed escape hatches (Prisma `tx` parameter, audit log `oldValues`/`newValues`).

---

### 📁 1. Backend Folder Structure

The agent MUST organize the NestJS backend code into this exact folder structure. Every new module follows this convention.

```
backend/
├── prisma/
│   ├── schema.prisma          # Single source of truth for all models
│   ├── migrations/             # Prisma migrate output
│   └── seed.ts                 # Database seeder (dev/staging data)
├── src/
│   ├── main.ts                 # Bootstrap: GlobalPipes, Versioning, CORS, Prefix
│   ├── app.module.ts           # Root module — imports ALL domain modules
│   │
│   ├── core/                   # CoreModule — shared infrastructure
│   │   ├── core.module.ts
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts      # Primary + Replica + Soft-delete extension
│   │   ├── redis/
│   │   │   └── redis.module.ts        # CacheModule registration
│   │   ├── storage/
│   │   │   ├── storage.module.ts
│   │   │   └── storage.service.ts     # S3 upload/download/presign
│   │   ├── audit/
│   │   │   ├── audit.module.ts
│   │   │   └── audit.service.ts       # Cross-cutting audit logger
│   │   └── config/
│   │       └── env.validation.ts      # Joi/class-validator env schema
│   │
│   ├── common/                 # Shared utilities (non-module)
│   │   ├── decorators/
│   │   │   └── require-roles.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── school-isolation.guard.ts
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── response-transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── parse-uuid.pipe.ts
│   │   └── dto/
│   │       └── pagination.dto.ts       # Shared pagination DTO
│   │
│   ├── modules/                # Domain modules
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── jwt-refresh.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── refresh-token.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── schools/
│   │   │   ├── schools.module.ts
│   │   │   ├── schools.controller.ts
│   │   │   ├── schools.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── academic/
│   │   │   ├── academic.module.ts
│   │   │   ├── academic-year.controller.ts
│   │   │   ├── academic-year.service.ts
│   │   │   ├── subject.controller.ts
│   │   │   ├── subject.service.ts
│   │   │   ├── grade.controller.ts     # "Grade" = NEB Class (11, 12)
│   │   │   ├── grade.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── students/
│   │   │   ├── students.module.ts
│   │   │   ├── students.controller.ts
│   │   │   ├── students.service.ts
│   │   │   ├── enrollment.controller.ts
│   │   │   ├── enrollment.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── exams/
│   │   │   ├── exams.module.ts
│   │   │   ├── exams.controller.ts
│   │   │   ├── exams.service.ts
│   │   │   ├── exam-result.controller.ts
│   │   │   ├── exam-result.service.ts
│   │   │   └── utils/
│   │   │       └── neb-grading.util.ts
│   │   │
│   │   ├── finance/
│   │   │   ├── finance.module.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── payment.service.ts
│   │   │   ├── invoice.controller.ts
│   │   │   ├── invoice.service.ts
│   │   │   ├── idempotency.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.gateway.ts    # WebSocket gateway
│   │   │   └── notifications.service.ts
│   │   │
│   │   └── reports/
│   │       ├── reports.module.ts
│   │       ├── reports.controller.ts
│   │       ├── reports.service.ts
│   │       └── workers/
│   │           └── pdf.worker.ts
│   │
│   └── health/
│       ├── health.module.ts
│       └── health.controller.ts       # /health endpoint (MySQL + Redis check)
│
├── test/
│   ├── jest-e2e.config.ts
│   ├── setup.ts                        # Global test setup (test DB, Redis mock)
│   └── factories/                      # Test data factories
│       ├── school.factory.ts
│       ├── user.factory.ts
│       └── student.factory.ts
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .env.test
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

**Rules for the agent:**

- When creating a new module, ALWAYS create the full set: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/` folder.
- NEVER place business logic in controllers. Controllers only validate input (via DTOs), extract `schoolId` from JWT, and delegate to services.
- NEVER create "barrel" `index.ts` files that re-export everything. Import directly from the source file.

---

### 📁 2. Frontend Folder Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── main.tsx                        # React entry point
│   ├── App.tsx                         # Router + providers
│   │
│   ├── api/                            # API client layer
│   │   ├── client.ts                   # Axios instance with interceptors
│   │   ├── auth.api.ts
│   │   ├── students.api.ts
│   │   ├── finance.api.ts
│   │   ├── exams.api.ts
│   │   └── academic.api.ts
│   │
│   ├── hooks/                          # TanStack Query hooks
│   │   ├── useAuth.ts
│   │   ├── useStudents.ts
│   │   ├── usePayments.ts
│   │   └── useExams.ts
│   │
│   ├── components/                     # Reusable UI components
│   │   ├── ui/                         # Primitives (Button, Input, Modal, Table)
│   │   ├── layout/                     # Shell, Sidebar, Topbar
│   │   └── forms/                      # Form components with react-hook-form
│   │
│   ├── pages/                          # Route-level page components
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── students/
│   │   ├── exams/
│   │   ├── finance/
│   │   └── reports/
│   │
│   ├── stores/                         # Zustand stores (auth, UI state)
│   │   └── auth.store.ts
│   │
│   ├── types/                          # Shared TypeScript types
│   │   ├── api.types.ts
│   │   ├── student.types.ts
│   │   └── exam.types.ts
│   │
│   └── utils/
│       ├── format-date.ts
│       └── format-currency.ts          # NPR (Nepalese Rupee) formatting
│
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

### 🐳 3. Docker Compose (Local Development)

The agent MUST use this `docker-compose.yml` for local development. It provides MySQL 8, Redis, and MinIO (S3-compatible) with no external dependencies.

```yaml
# docker-compose.yml (project root)
version: "3.8"

services:
  mysql:
    image: mysql:8.0
    container_name: sms-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: sms_erp
      MYSQL_USER: sms_user
      MYSQL_PASSWORD: sms_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

  mysql-replica:
    image: mysql:8.0
    container_name: sms-mysql-replica
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: sms_erp
      MYSQL_USER: sms_user
      MYSQL_PASSWORD: sms_password
    ports:
      - "3307:3306"
    volumes:
      - mysql_replica_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

  redis:
    image: redis:7-alpine
    container_name: sms-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    container_name: sms-minio
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000" # S3 API
      - "9001:9001" # MinIO Console
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

  # Auto-create the default bucket on startup
  minio-init:
    image: minio/mc:latest
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 3;
      mc alias set local http://minio:9000 minioadmin minioadmin;
      mc mb local/sms-bucket --ignore-existing;
      exit 0;
      "

volumes:
  mysql_data:
  mysql_replica_data:
  redis_data:
  minio_data:
```

---

### 🔑 4. Environment Variables

The agent MUST use this `.env.example` template. NEVER hardcode credentials in source code.

```env
# .env.example — Copy to .env and fill in values

# ==========================================
# DATABASE (MySQL)
# ==========================================
DATABASE_URL="mysql://sms_user:sms_password@localhost:3306/sms_erp"
DATABASE_REPLICA_URL="mysql://sms_user:sms_password@localhost:3307/sms_erp"

# ==========================================
# REDIS
# ==========================================
REDIS_HOST=localhost
REDIS_PORT=6379

# ==========================================
# JWT AUTH
# ==========================================
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# ==========================================
# S3 OBJECT STORAGE (MinIO for local dev)
# ==========================================
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET_NAME=sms-bucket
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# ==========================================
# APP CONFIG
# ==========================================
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# ==========================================
# THROTTLE (Rate Limiting)
# ==========================================
THROTTLE_TTL=60000
THROTTLE_LIMIT=60
```

**Rules for the agent:**

- NEVER create a `.env` file directly. Only create/update `.env.example`.
- ALL configuration values MUST be read via `@nestjs/config` `ConfigService`. NEVER use `process.env` directly in service code (the `StorageService` S3 client constructor is the sole exception documented in doc 4).
- Environment validation MUST happen at startup using Joi or `class-validator`:

```typescript
// src/core/config/env.validation.ts
import * as Joi from "joi";

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  DATABASE_REPLICA_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().default("localhost"),
  REDIS_PORT: Joi.number().default(6379),
  JWT_SECRET: Joi.string().required().min(32),
  JWT_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_SECRET: Joi.string().required().min(32),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  S3_ENDPOINT: Joi.string().required(),
  S3_REGION: Joi.string().default("us-east-1"),
  S3_BUCKET_NAME: Joi.string().required(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  CORS_ORIGIN: Joi.string().default("http://localhost:5173"),
});
```

---

### 📦 5. Backend Dependencies

When initializing the backend, install these exact packages:

```bash
# Core NestJS
pnpm add @nestjs/core @nestjs/common @nestjs/platform-express @nestjs/config @nestjs/swagger

# Database
pnpm add @prisma/client
pnpm add -D prisma

# Authentication
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
pnpm add -D @types/passport-jwt @types/bcrypt

# Validation
pnpm add class-validator class-transformer

# Rate Limiting
pnpm add @nestjs/throttler

# Caching
pnpm add @nestjs/cache-manager cache-manager cache-manager-redis-yet

# Background Jobs
pnpm add @nestjs/bullmq bullmq

# Object Storage
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# PDF Generation
pnpm add puppeteer

# WebSockets
pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io

# Logging
pnpm add nestjs-pino pino pino-http pino-pretty

# Health Checks
pnpm add @nestjs/terminus

# Env Validation
pnpm add joi

# Utilities
pnpm add uuid
pnpm add -D @types/uuid

# Testing
pnpm add -D jest @nestjs/testing @types/jest ts-jest supertest @types/supertest
```

---

### 📦 6. Frontend Dependencies

```bash
# Core
pnpm add react react-dom react-router-dom

# TypeScript
pnpm add -D typescript @types/react @types/react-dom

# Build
pnpm add -D vite @vitejs/plugin-react

# Styling
pnpm add tailwindcss @tailwindcss/vite

# State & Data Fetching
pnpm add @tanstack/react-query axios zustand

# Forms & Validation
pnpm add react-hook-form @hookform/resolvers zod

# UI Components
pnpm add @headlessui/react @heroicons/react

# WebSocket Client
pnpm add socket.io-client

# Utilities
pnpm add date-fns
```

---

### 🚀 7. Module Registration Order

The `AppModule` MUST import modules in this exact order to ensure dependency resolution:

```typescript
// src/app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { envValidationSchema } from "./core/config/env.validation";

@Module({
  imports: [
    // 1. Config FIRST (env vars available to everything below)
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    // 2. Core infrastructure
    CoreModule, // Prisma, Redis (CacheModule), Storage, Audit

    // 3. Auth (depends on Core for Prisma + Redis)
    AuthModule,

    // 4. Domain modules (depend on Core + Auth)
    UsersModule,
    SchoolsModule,
    AcademicModule,
    StudentsModule,
    ExamsModule,
    FinanceModule,

    // 5. Cross-cutting output modules
    NotificationsModule,
    ReportsModule,

    // 6. Health (depends on Core for Prisma + Redis checks)
    HealthModule,
  ],
})
export class AppModule {}
```

---

### 🐳 8. Dockerfile (Production)

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec prisma generate
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

# Puppeteer dependencies for PDF generation
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

---

### 📜 9. Database Migration Workflow

The agent MUST follow this workflow for schema changes:

```bash
# 1. Edit prisma/schema.prisma

# 2. Generate migration (NEVER use db push in production)
pnpm exec prisma migrate dev --name descriptive_migration_name

# 3. Generate updated Prisma Client
pnpm exec prisma generate

# 4. In production, apply migrations without generating:
pnpm exec prisma migrate deploy
```

**Rules:**

- NEVER use `prisma db push` in production — it can cause data loss.
- Migration names must be descriptive: `add_exam_result_table`, `add_idempotency_record`, etc.
- All migrations must be committed to version control.
- The seeder (`prisma/seed.ts`) must be idempotent — safe to run multiple times.

---

### 🌱 10. Database Seeder

The seeder creates development data. It MUST be idempotent (use `upsert` or check-before-create).

```typescript
// prisma/seed.ts
import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // 1. Create a demo school
  const school = await prisma.school.upsert({
    where: { code: "NEB-DEMO-001" },
    update: {},
    create: {
      name: "Demo Secondary School",
      code: "NEB-DEMO-001",
      address: "Kathmandu, Nepal",
      phone: "+977-01-1234567",
    },
  });

  // 2. Create admin user
  const passwordHash = await bcrypt.hash("Admin@123", 10);
  await prisma.user.upsert({
    where: { email: "admin@demo.school.np" },
    update: {},
    create: {
      schoolId: school.id,
      email: "admin@demo.school.np",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log("✅ Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```
