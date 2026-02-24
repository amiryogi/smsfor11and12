import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';

interface IdempotencyResult<T> {
  cached: boolean;
  data: T;
  statusCode: number;
}

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async execute<T>(
    key: string,
    schoolId: string,
    endpoint: string,
    handler: () => Promise<{ data: T; statusCode: number }>,
    ttlHours = 24,
  ): Promise<IdempotencyResult<T>> {
    // Check for existing record
    const existing = await this.prisma.idempotencyRecord.findFirst({
      where: { idempotencyKey: key, schoolId, endpoint },
    });

    if (existing && existing.expiresAt > new Date()) {
      return {
        cached: true,
        data: existing.responseBody as T,
        statusCode: existing.statusCode,
      };
    }

    // If expired, delete it
    if (existing) {
      await this.prisma.idempotencyRecord.delete({
        where: { id: existing.id },
      });
    }

    // Execute the handler
    const result = await handler();

    // Store the result
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    await this.prisma.idempotencyRecord.create({
      data: {
        idempotencyKey: key,
        schoolId,
        endpoint,
        responseBody: result.data as any,
        statusCode: result.statusCode,
        expiresAt,
      },
    });

    return {
      cached: false,
      data: result.data,
      statusCode: result.statusCode,
    };
  }

  async cleanup(): Promise<number> {
    const result = await this.prisma.idempotencyRecord.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
