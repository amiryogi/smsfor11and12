# Context: Background Jobs (BullMQ) & Object Storage (S3)

## Domain: NEB +2 School Management ERP

This document outlines the strict coding standards for asynchronous background processing and file management.

### 🚨 Strict Rules for Jobs and Storage

1. **NO Local File System (`fs`):** You MUST NOT use `fs.writeFileSync` or save generated PDFs to the local disk. Local disk storage will not survive container restarts.
2. **Buffer to S3:** Puppeteer must generate PDFs as in-memory Buffers, which are then uploaded directly to S3-compatible storage (AWS S3, MinIO, or DigitalOcean Spaces) using `@aws-sdk/client-s3`.
3. **Non-Blocking HTTP:** Endpoints triggering heavy tasks (e.g., bulk marksheets, fee receipts) MUST return a `202 Accepted` status with a `jobId` immediately. They must never wait for the PDF generation to complete.
4. **Resilience & Retries:** All BullMQ jobs MUST be configured with exponential backoff retries. Unresolvable jobs must trigger a failure notification.
5. **Dead-Letter Queue (DLQ):** Every BullMQ queue MUST have a dedicated dead-letter queue. When a job exhausts all retry attempts, it MUST be moved to the DLQ and trigger an alert notification (via WebSocket to admins + structured log). Jobs must NEVER be silently discarded. The DLQ must be monitored and surfaced in the admin dashboard.

---

### ☁️ 1. The S3 Storage Service Pattern

When instructed to "upload a file" or "store a document", Copilot must use or mimic this `StorageService` pattern.

```typescript
// src/core/storage/storage.service.ts
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName = process.env.S3_BUCKET_NAME;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      endpoint: process.env.S3_ENDPOINT, // Used for MinIO
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  /**
   * Uploads an in-memory buffer directly to S3.
   * Returns the exact S3 Key for database storage.
   */
  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    mimeType: string,
  ): Promise<{ s3Key: string; size: number }> {
    try {
      const s3Key = `${folder}/${uuidv4()}`;
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
          Body: buffer,
          ContentType: mimeType,
        }),
      );
      return { s3Key, size: buffer.length };
    } catch (error) {
      throw new InternalServerErrorException(
        "Failed to upload file to Object Storage",
      );
    }
  }
}
```

---

### 💀 2. Dead-Letter Queue (DLQ) Pattern

When a BullMQ job exhausts all retry attempts, it must NOT be silently dropped. Copilot MUST implement the following dead-letter queue pattern for every worker in the system.

**Why this matters:** Without a DLQ, a failed PDF receipt generation means a parent never gets their receipt and no one is alerted. Financial and academic documents are legally required — silent failures are unacceptable.

**Queue Registration (in module):**

```typescript
// src/modules/reports/reports.module.ts
import { BullModule } from "@nestjs/bullmq";

@Module({
  imports: [
    // Primary queue
    BullModule.registerQueue({
      name: "pdf-generation",
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { age: 86400 }, // Keep completed jobs for 24hrs
        removeOnFail: false, // NEVER auto-remove failed jobs
      },
    }),
    // Dead-letter queue for permanently failed jobs
    BullModule.registerQueue({
      name: "pdf-generation-dlq",
    }),
  ],
})
export class ReportsModule {}
```

**Worker with DLQ handling:**

```typescript
// src/modules/reports/workers/pdf.worker.ts
import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { Job, Queue } from "bullmq";
import { Logger } from "@nestjs/common";
import { NotificationsGateway } from "../../notifications/notifications.gateway";

@Processor("pdf-generation")
export class PdfWorker extends WorkerHost {
  private readonly logger = new Logger(PdfWorker.name);

  constructor(
    @InjectQueue("pdf-generation-dlq") private dlqQueue: Queue,
    private notificationsGateway: NotificationsGateway,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    // ... normal PDF generation + S3 upload logic ...
  }

  /**
   * CRITICAL: When all retries are exhausted, move to DLQ and alert admins.
   * This fires ONLY after the final attempt fails.
   */
  @OnWorkerEvent("failed")
  async onFailed(job: Job, error: Error) {
    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
      // 1. Move to Dead-Letter Queue with full context
      await this.dlqQueue.add("failed-pdf", {
        originalJobId: job.id,
        originalQueue: "pdf-generation",
        payload: job.data,
        error: error.message,
        stack: error.stack,
        failedAt: new Date().toISOString(),
        attemptsMade: job.attemptsMade,
      });

      // 2. Structured log for monitoring/alerting systems
      this.logger.error(
        `Job permanently failed after ${job.attemptsMade} attempts. Moved to DLQ.`,
        {
          jobId: job.id,
          queue: "pdf-generation",
          schoolId: job.data.schoolId,
          type: job.data.type,
          error: error.message,
        },
      );

      // 3. Real-time notification to school admins
      this.notificationsGateway.broadcastToSchool(
        job.data.schoolId,
        "JOB_FAILED",
        {
          message: `Background task failed: ${job.data.type} for ${job.data.studentId ?? "bulk operation"}. Admin attention required.`,
          jobId: job.id,
          type: job.data.type,
        },
      );
    }
  }
}
```

**DLQ Admin Endpoint (for dashboard monitoring):**

```typescript
// src/modules/reports/reports.controller.ts
@Get('admin/failed-jobs')
@RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
async getFailedJobs(@Request() req) {
  const jobs = await this.dlqQueue.getJobs(['waiting', 'delayed'], 0, 50);
  // Filter by schoolId for tenant isolation
  return jobs
    .filter(job => job.data.payload?.schoolId === req.user.schoolId)
    .map(job => ({
      id: job.id,
      type: job.data.payload?.type,
      error: job.data.error,
      failedAt: job.data.failedAt,
      originalJobId: job.data.originalJobId,
    }));
}

@Post('admin/failed-jobs/:jobId/retry')
@RequireRoles(Role.ADMIN, Role.SUPER_ADMIN)
async retryFailedJob(@Param('jobId') jobId: string, @Request() req) {
  // Re-queue the original job payload back to the primary queue
  const dlqJob = await this.dlqQueue.getJob(jobId);
  if (!dlqJob || dlqJob.data.payload?.schoolId !== req.user.schoolId) {
    throw new NotFoundException('Job not found');
  }
  await this.pdfQueue.add(dlqJob.data.payload.type, dlqJob.data.payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
  await dlqJob.remove();
  return { message: 'Job re-queued for retry' };
}
```

> **Rule for the agent:** Every new BullMQ queue registered in the system MUST have a corresponding `-dlq` queue and the `@OnWorkerEvent('failed')` handler wired up. This pattern applies to `pdf-generation`, `bulk-email`, `bulk-exam-finalization`, and any future queues.
