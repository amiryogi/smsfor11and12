import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { StorageModule } from './storage/storage.module.js';
import { AuditModule } from './audit/audit.module.js';
import { EmailModule } from './email/email.module.js';

@Module({
  imports: [PrismaModule, RedisModule, StorageModule, AuditModule, EmailModule],
})
export class CoreModule {}
