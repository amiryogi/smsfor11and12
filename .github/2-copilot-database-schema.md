# Context: Database Schema & ORM Rules (Prisma)

## Domain: NEB +2 School Management ERP

This document defines the data models and ORM rules for the application. You must use **Prisma ORM** with **MySQL**.

### 🚨 Strict Database Rules for the Agent

1. **Multi-Tenancy:** Every model (except `School` itself and system-wide configs) MUST include `schoolId` as a foreign key.
2. **Indexing:** You MUST add composite indexes on `[schoolId, deletedAt]` for all tenant-specific tables to optimize query performance on both the primary DB and read replicas.
3. **Soft Deletes:** Every model MUST have a `deletedAt DateTime?` field. NEVER write Prisma queries that actually delete records; always `update` the `deletedAt` field.
4. **Primary Keys:** All `id` fields MUST be `String @id @default(uuid())`. Do not use auto-incrementing integers.
5. **Cross-Cutting Audit Logs:** The `AuditLog` table must be used to track ALL significant state changes across the system (e.g., student admission, grade changes, fee payments, user role changes).
6. **Automatic Soft-Delete Filtering:** You MUST register a Prisma Client extension (middleware) that automatically filters out soft-deleted records (`deletedAt IS NULL`) on all `findMany`, `findFirst`, `findUnique`, and `count` queries. NEVER rely on manually adding `where: { deletedAt: null }` to every query — the middleware must handle this globally.

---

### 🗄 Prisma Schema Blueprint

Use the following schema structure as the exact baseline for the project. When generating features, extend this schema but NEVER violate the rules above.

```prisma
generator client {
  provider = "prisma-client-js"
  // Note: Read replica routing is handled at the NestJS service level via custom Prisma Client extensions.
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ==========================================
// 🏫 TENANT & USERS
// ==========================================

model School {
  id        String    @id @default(uuid())
  name      String
  code      String    @unique // e.g., NEB School Code
  address   String?
  phone     String?

  users     User[]
  students  Student[]
  auditLogs AuditLog[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
}

model User {
  id           String    @id @default(uuid())
  schoolId     String
  school       School    @relation(fields: [schoolId], references: [id])

  email        String    @unique
  passwordHash String
  role         Role      @default(TEACHER) // ENUM: ADMIN, TEACHER, ACCOUNTANT, PARENT, STUDENT
  isActive     Boolean   @default(true)

  auditLogs    AuditLog[] // Actions performed by this user

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  @@index([schoolId, deletedAt])
}

// ==========================================
// 🎓 CORE ACADEMICS & STUDENTS
// ==========================================

model Student {
  id             String    @id @default(uuid())
  schoolId       String
  school         School    @relation(fields: [schoolId], references: [id])

  registrationNo String    // NEB Registration Number
  firstName      String
  lastName       String
  dob            DateTime
  status         String    @default("ACTIVE") // ACTIVE, GRADUATED, DROPOUT

  payments       Payment[]

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  @@index([schoolId, deletedAt])
}

// ==========================================
// 💰 FINANCE ENGINE (ACID REQUIRED)
// ==========================================

model Payment {
  id            String    @id @default(uuid())
  schoolId      String
  studentId     String
  student       Student   @relation(fields: [studentId], references: [id])

  amount        Decimal   @db.Decimal(10, 2)
  paymentMethod String    // CASH, BANK_TRANSFER, ONLINE
  receiptUrl    String?   // S3 Object URL for generated receipt
  status        String    @default("COMPLETED") // COMPLETED, REVERSED

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  @@index([schoolId, studentId, deletedAt])
}

// ==========================================
// 🔍 CROSS-CUTTING AUDIT TRAIL
// ==========================================

model AuditLog {
  id           String    @id @default(uuid())
  schoolId     String
  school       School    @relation(fields: [schoolId], references: [id])

  userId       String?
  user         User?     @relation(fields: [userId], references: [id])

  entityName   String    // e.g., "Student", "Payment", "ExamResult"
  entityId     String    // The UUID of the record changed
  action       String    // CREATE, UPDATE, SOFT_DELETE, REVERSE

  oldValues    Json?     // Previous state
  newValues    Json?     // New state
  ipAddress    String?

  createdAt    DateTime  @default(now())

  @@index([schoolId, entityName, entityId])
}

// ==========================================
// ☁️ FILE ASSETS (S3 References)
// ==========================================

model FileAsset {
  id           String    @id @default(uuid())
  schoolId     String

  fileName     String
  s3Key        String    @unique // The exact path/key in the S3 bucket
  mimeType     String
  sizeBytes    Int

  context      String    // e.g., "EXAM_MARKSHEET", "FEE_RECEIPT", "PROFILE_PIC"
  contextId    String?   // ID of the related record (e.g., Payment ID)

  createdAt    DateTime  @default(now())
  deletedAt    DateTime?

  @@index([schoolId, context, contextId])
}

enum Role {
  SUPER_ADMIN
  ADMIN
  TEACHER
  ACCOUNTANT
  PARENT
  STUDENT
}
```

---

### 🛡️ Prisma Soft-Delete Middleware (REQUIRED)

Copilot MUST register the following Prisma Client extension in the `PrismaService` to globally enforce soft-delete filtering. Without this, every missed `where: { deletedAt: null }` is a data integrity bug that exposes "deleted" records.

```typescript
// src/core/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  public readonly replica: PrismaClient;

  constructor() {
    super({
      datasources: { db: { url: process.env.DATABASE_URL } },
    });

    this.replica = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_REPLICA_URL } },
    });

    // ========================================
    // 🛡️ SOFT-DELETE EXTENSION (Global)
    // ========================================
    // This extension is applied to BOTH primary and replica clients.
    // It automatically injects `deletedAt: null` into all read queries
    // and converts `delete` operations into soft-delete updates.
    this.applySoftDeleteExtension(this);
    this.applySoftDeleteExtension(this.replica);
  }

  private applySoftDeleteExtension(client: any) {
    // Use Prisma $extends to intercept queries globally
    // This MUST be implemented as a Prisma Client extension, NOT as deprecated middleware.
    return client.$extends({
      query: {
        $allModels: {
          async findMany({ model, operation, args, query }) {
            args.where = { ...args.where, deletedAt: null };
            return query(args);
          },
          async findFirst({ model, operation, args, query }) {
            args.where = { ...args.where, deletedAt: null };
            return query(args);
          },
          async findUnique({ model, operation, args, query }) {
            // findUnique does not support compound where easily,
            // so convert to findFirst with the same unique filter + deletedAt
            args.where = { ...args.where, deletedAt: null };
            return query(args);
          },
          async count({ model, operation, args, query }) {
            args.where = { ...args.where, deletedAt: null };
            return query(args);
          },
          async delete({ model, operation, args, query }) {
            // Convert hard delete to soft delete
            return client[model].update({
              ...args,
              data: { deletedAt: new Date() },
            });
          },
          async deleteMany({ model, operation, args, query }) {
            // Convert hard deleteMany to soft delete
            return client[model].updateMany({
              ...args,
              data: { deletedAt: new Date() },
            });
          },
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    await this.replica.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.replica.$disconnect();
  }
}
```

**Key rules for the agent:**

- **NEVER** manually add `where: { deletedAt: null }` in service code — the extension handles it.
- When you explicitly need to query soft-deleted records (e.g., for admin recovery or audit views), use a separate unfiltered Prisma client instance or add `deletedAt: { not: null }` to override.
- The `delete` and `deleteMany` operations are intercepted and converted to soft deletes. This means existing code calling `prisma.student.delete()` will safely soft-delete without any code changes.
- The extension MUST be applied to both the primary and replica clients.
