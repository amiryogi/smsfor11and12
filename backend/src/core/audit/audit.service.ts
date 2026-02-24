import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AuditLogDto {
  schoolId: string;
  userId?: string;
  entityName: string;
  entityId: string;
  action: string; // CREATE, UPDATE, SOFT_DELETE, REVERSE
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an audit entry. Supports passing a Prisma transaction client
   * so the audit log is part of the same ACID transaction.
   */
  async log(dto: AuditLogDto, tx?: unknown): Promise<void> {
    const db = (tx as typeof this.prisma) || this.prisma;
    await db.auditLog.create({
      data: {
        schoolId: dto.schoolId,
        userId: dto.userId,
        entityName: dto.entityName,
        entityId: dto.entityId,
        action: dto.action,
        oldValues: dto.oldValues ? (dto.oldValues as object) : undefined,
        newValues: dto.newValues ? (dto.newValues as object) : undefined,
        ipAddress: dto.ipAddress,
      },
    });
  }
}
