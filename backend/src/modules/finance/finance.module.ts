import { Module } from '@nestjs/common';
import { FeeStructureController } from './fee-structure.controller.js';
import { FeeStructureService } from './fee-structure.service.js';
import { InvoiceController } from './invoice.controller.js';
import { InvoiceService } from './invoice.service.js';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { IdempotencyService } from './idempotency.service.js';

@Module({
  controllers: [FeeStructureController, InvoiceController, PaymentController],
  providers: [
    FeeStructureService,
    InvoiceService,
    PaymentService,
    IdempotencyService,
  ],
  exports: [InvoiceService, PaymentService],
})
export class FinanceModule {}
