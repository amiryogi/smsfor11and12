import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { PdfProcessor } from './processors/pdf.processor.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'pdf-generation' },
      { name: 'pdf-generation-dlq' },
    ),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 20 }] }),
    NotificationsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, PdfProcessor],
  exports: [ReportsService],
})
export class ReportsModule {}
