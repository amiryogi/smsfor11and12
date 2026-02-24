import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { envValidationSchema } from './core/config/env.validation.js';
import { CoreModule } from './core/core.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { SchoolsModule } from './modules/schools/schools.module.js';
import { AcademicModule } from './modules/academic/academic.module.js';
import { StudentsModule } from './modules/students/students.module.js';
import { ExamsModule } from './modules/exams/exams.module.js';
import { FinanceModule } from './modules/finance/finance.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    // Global config with validation
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),

    // Structured logging
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      },
    }),

    // BullMQ global connection
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),

    // Core infrastructure
    CoreModule,

    // Feature modules
    AuthModule,
    UsersModule,
    SchoolsModule,
    AcademicModule,
    StudentsModule,
    ExamsModule,
    FinanceModule,
    NotificationsModule,
    ReportsModule,

    // Health checks (no auth)
    HealthModule,
  ],
})
export class AppModule {}
