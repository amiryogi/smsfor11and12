import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../core/prisma/prisma.service.js';

/**
 * Scheduled job that purges expired IdempotencyRecord rows every 6 hours.
 * Ensures the idempotency table doesn't grow unbounded.
 */
@Injectable()
export class IdempotencyCleanupService implements OnModuleInit {
  private readonly logger = new Logger(IdempotencyCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.logger.log('IdempotencyCleanupService initialized — runs every 6 hours');
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async handleCleanup() {
    this.logger.log('Running idempotency record cleanup...');

    try {
      const result = await this.prisma.idempotencyRecord.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      this.logger.log(`Purged ${result.count} expired idempotency records`);
    } catch (error) {
      this.logger.error(
        `Idempotency cleanup failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }
}
