# Context: Finance Engine & Audit Logging

## Domain: NEB +2 School Management ERP

This document outlines the strict coding standards for the `FinanceModule` and the cross-cutting `AuditModule`.

### 🚨 Strict Rules for Financial Operations

1. **ACID Transactions ONLY:** Every financial operation (fee payment, discount application, refund) MUST be wrapped in a Prisma interactive transaction (`prisma.$transaction`).
2. **Immutability:** Financial records are immutable. NEVER `UPDATE` a payment amount or `DELETE` a payment row. If a mistake is made, you must create a **Reversal Entry** (a negative payment) and log it.
3. **Atomic Balance Updates:** Always use Prisma's atomic operations (e.g., `increment`, `decrement`) when updating balances to prevent race conditions during concurrent requests.
4. **Audit Everything:** Every financial transaction must be accompanied by an `AuditLog` entry detailing the user, the old state, and the new state.
5. **Idempotency Keys:** Every payment endpoint MUST accept an `idempotencyKey` (a client-generated UUID) in the request body or header (`Idempotency-Key`). Before processing, the service must check if a payment with that key already exists. If it does, return the existing result instead of creating a duplicate. This prevents double charges from network retries, client double-clicks, or webhook replays.

---

### 🛠 1. The Audit Logging Pattern

When instructed to "add audit logging" to a service, Copilot must use or mimic the following `AuditService` pattern. This ensures legally compliant tracking for NEB and financial audits.

```typescript
// src/core/audit/audit.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface CreateAuditLogDto {
  schoolId: string;
  userId: string;
  entityName: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "SOFT_DELETE" | "REVERSE";
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Appends an audit log entry.
   * Can be used inside an existing Prisma transaction by passing the transaction client (tx).
   */
  async log(dto: CreateAuditLogDto, tx?: any): Promise<void> {
    const db = tx || this.prisma;
    await db.auditLog.create({
      data: {
        schoolId: dto.schoolId,
        userId: dto.userId,
        entityName: dto.entityName,
        entityId: dto.entityId,
        action: dto.action,
        oldValues: dto.oldValues ? JSON.stringify(dto.oldValues) : null,
        newValues: dto.newValues ? JSON.stringify(dto.newValues) : null,
        ipAddress: dto.ipAddress,
      },
    });
  }
}
```

2. The Payment Processing Pattern
   When instructed to "create the payment endpoint" or "implement fee collection", Copilot must use the following transactional flow.

The Payment Flow:

Start prisma.$transaction.

Verify student exists and belongs to the same schoolId.

Insert Payment record.

Update Student financial metrics (if any, using atomic updates).

Insert AuditLog entry inside the same transaction.

Commit transaction.

Post-Commit: Dispatch a BullMQ job to generate the PDF receipt and upload it to S3.

// src/modules/finance/payment.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class PaymentService {
constructor(
private prisma: PrismaService,
private auditService: AuditService,
@InjectQueue('pdf-generation') private pdfQueue: Queue,
) {}

async processPayment(schoolId: string, studentId: string, amount: number, userId: string) {
// 1. Execute ACID Transaction
const result = await this.prisma.$transaction(async (tx) => {

      // A. Verify Student
      const student = await tx.student.findUnique({
        where: { id: studentId, schoolId },
      });
      if (!student) throw new BadRequestException('Student not found');

      // B. Create Payment Record
      const payment = await tx.payment.create({
        data: {
          schoolId,
          studentId,
          amount,
          paymentMethod: 'CASH', // Example
          status: 'COMPLETED',
        },
      });

      // C. Create Audit Log
      await this.auditService.log({
        schoolId,
        userId,
        entityName: 'Payment',
        entityId: payment.id,
        action: 'CREATE',
        newValues: { amount, status: 'COMPLETED' },
      }, tx); // Pass transaction client!

      return payment;
    });

    // 2. Post-Transaction: Queue PDF Receipt Generation (S3 Upload)
    await this.pdfQueue.add('generate-receipt', {
      schoolId,
      paymentId: result.id,
      studentId: studentId,
      type: 'FEE_RECEIPT'
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 } // Retry logic
    });

    return result;

}
}

````

### 🔑 3. The Idempotency Key Pattern

When instructed to "create the payment endpoint" or any financial mutation endpoint, Copilot MUST implement idempotency to prevent duplicate transactions from network retries or client double-clicks.

**Schema addition** — Add this model to the Prisma schema:

```prisma
model IdempotencyRecord {
  id             String    @id @default(uuid())
  schoolId       String
  idempotencyKey String    // Client-provided UUID
  endpoint       String    // e.g., "POST /api/v1/payments"
  responseBody   Json      // Cached response to return on replay
  statusCode     Int       // HTTP status code of the original response

  createdAt      DateTime  @default(now())
  expiresAt      DateTime  // Auto-expire after 24 hours

  @@unique([schoolId, idempotencyKey, endpoint])
  @@index([expiresAt]) // For cleanup job
}
````

**Service implementation:**

```typescript
// src/modules/finance/idempotency.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service";

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if this idempotency key has already been processed.
   * Returns the cached response if found, or null if this is a new request.
   */
  async checkExisting(
    schoolId: string,
    idempotencyKey: string,
    endpoint: string,
  ) {
    const existing = await this.prisma.idempotencyRecord.findUnique({
      where: {
        schoolId_idempotencyKey_endpoint: {
          schoolId,
          idempotencyKey,
          endpoint,
        },
      },
    });

    if (existing && existing.expiresAt > new Date()) {
      return { statusCode: existing.statusCode, body: existing.responseBody };
    }
    return null;
  }

  /**
   * Store the response for this idempotency key after successful processing.
   * Must be called INSIDE the same Prisma transaction as the payment.
   */
  async recordResponse(
    schoolId: string,
    idempotencyKey: string,
    endpoint: string,
    statusCode: number,
    responseBody: any,
    tx?: any,
  ) {
    const db = tx || this.prisma;
    await db.idempotencyRecord.create({
      data: {
        schoolId,
        idempotencyKey,
        endpoint,
        statusCode,
        responseBody,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour TTL
      },
    });
  }
}
```

**Updated Payment Flow (with idempotency):**

```typescript
// In PaymentService.processPayment()
async processPayment(
  schoolId: string,
  studentId: string,
  amount: number,
  userId: string,
  idempotencyKey: string, // REQUIRED from client
) {
  const endpoint = 'POST /api/v1/payments';

  // 1. Check for duplicate request
  const existing = await this.idempotencyService.checkExisting(schoolId, idempotencyKey, endpoint);
  if (existing) {
    return existing.body; // Return cached response — no duplicate charge
  }

  // 2. Execute ACID Transaction (includes idempotency record)
  const result = await this.prisma.$transaction(async (tx) => {
    const student = await tx.student.findUnique({ where: { id: studentId, schoolId } });
    if (!student) throw new BadRequestException('Student not found');

    const payment = await tx.payment.create({
      data: { schoolId, studentId, amount, paymentMethod: 'CASH', status: 'COMPLETED' },
    });

    await this.auditService.log({
      schoolId, userId, entityName: 'Payment', entityId: payment.id,
      action: 'CREATE', newValues: { amount, status: 'COMPLETED' },
    }, tx);

    // Record idempotency INSIDE the transaction to guarantee atomicity
    await this.idempotencyService.recordResponse(
      schoolId, idempotencyKey, endpoint, 201, payment, tx,
    );

    return payment;
  });

  // 3. Post-Transaction: Queue PDF Receipt
  await this.pdfQueue.add('generate-receipt', {
    schoolId, paymentId: result.id, studentId, type: 'FEE_RECEIPT',
  }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });

  return result;
}
```

**Controller enforcement:**

```typescript
// The controller MUST extract the idempotency key and reject requests without one
@Post()
@RequireRoles(Role.ADMIN, Role.ACCOUNTANT)
async createPayment(@Body() dto: CreatePaymentDto, @Request() req) {
  if (!dto.idempotencyKey) {
    throw new BadRequestException('idempotencyKey is required for financial operations');
  }
  return this.paymentService.processPayment(
    req.user.schoolId, dto.studentId, dto.amount, req.user.sub, dto.idempotencyKey,
  );
}
```

> **Cleanup:** Schedule a BullMQ recurring job to delete expired `IdempotencyRecord` rows (where `expiresAt < now()`) every 6 hours to prevent table bloat.
