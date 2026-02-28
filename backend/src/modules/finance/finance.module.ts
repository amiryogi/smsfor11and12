import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { FeeStructureController } from './fee-structure.controller.js';
import { FeeStructureService } from './fee-structure.service.js';
import { InvoiceController } from './invoice.controller.js';
import { InvoiceService } from './invoice.service.js';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { IdempotencyService } from './idempotency.service.js';
import { IdempotencyCleanupService } from './idempotency-cleanup.service.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 30 }] }),
  ],
  controllers: [FeeStructureController, InvoiceController, PaymentController],
  providers: [
    FeeStructureService,
    InvoiceService,
    PaymentService,
    IdempotencyService,
    IdempotencyCleanupService,
  ],
  exports: [InvoiceService, PaymentService],
})
export class FinanceModule {}
