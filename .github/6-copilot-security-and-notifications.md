# Context: Security, RBAC & Real-Time Notifications

## Domain: NEB +2 School Management ERP

This document outlines the strict rules for API security, tenant isolation, and real-time user notifications.

### 🚨 Strict Security Rules

1. **Brute Force Protection:** All authentication endpoints (especially `/auth/login` and `/auth/refresh`) MUST be strictly rate-limited using `@nestjs/throttler` to prevent credential stuffing.
2. **Tenant Isolation:** Users MUST NEVER access data belonging to another `schoolId`. A custom `SchoolIsolationGuard` or Prisma Client extension must enforce this implicitly.
3. **RBAC Enforcement:** Every endpoint must be explicitly decorated with `@Roles()` to define which user types (ADMIN, TEACHER, ACCOUNTANT, PARENT, STUDENT) can access it.
4. **Real-Time Delivery:** "In-app notifications" (e.g., when a background PDF job finishes) MUST be delivered in real-time using WebSockets (Socket.io) or Server-Sent Events (SSE). Do not rely on client-side polling.
5. **DTO Validation (MANDATORY):** Every API endpoint MUST validate incoming request bodies using `class-validator` decorators and NestJS `ValidationPipe`. NEVER trust raw client input. All DTOs must use strict whitelisting (`whitelist: true`, `forbidNonWhitelisted: true`) to reject unknown properties. This applies to ALL modules, not just Auth.

---

### 🛡️ 1. Rate Limiting Pattern for Auth

When instructed to "create the auth controller" or "implement login", Copilot must apply strict throttling to prevent brute-force attacks.

```typescript
// src/modules/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { ThrottlerGuard, Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";

@Controller({ path: "auth", version: "1" }) // Note: API Versioning enforced here
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Strict limit: Max 5 requests per minute for login
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Strict limit: Max 10 requests per minute for token refresh
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post("refresh")
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshDto);
  }
}
```

🔐 2. RBAC and Tenant Isolation Guards
When creating new controllers, combine standard JWT authentication, Role-based access, and the active schoolId.

TypeScript
// src/common/decorators/require-roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
Controller Implementation:

TypeScript
// src/modules/students/students.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/require-roles.decorator';
import { Role } from '@prisma/client';

@Controller({ path: 'students', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {

@Get()
@RequireRoles(Role.ADMIN, Role.TEACHER)
async getStudents(@Request() req) {
// req.user contains the decoded JWT payload
const schoolId = req.user.schoolId;

    // The service must ALWAYS use this schoolId to isolate data
    return this.studentsService.findAllForSchool(schoolId);

}
}
🔔 3. Real-Time Notification Pattern (WebSockets)
When a BullMQ background job (like PDF generation) completes, or a critical update happens (e.g., NEB results published), the backend must push a real-time notification to the Parent/Student portal.

TypeScript
// src/modules/notifications/notifications.gateway.ts
import {
WebSocketGateway,
WebSocketServer,
OnGatewayConnection,
ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
cors: { origin: '\*' },
namespace: '/notifications'
})
export class NotificationsGateway implements OnGatewayConnection {
@WebSocketServer()
server: Server;

constructor(private jwtService: JwtService) {}

async handleConnection(@ConnectedSocket() client: Socket) {
try {
// 1. Authenticate WebSocket connection
const token = client.handshake.auth.token;
const payload = this.jwtService.verify(token);

      // 2. Join a specific room based on User ID for targeted notifications
      client.join(`user_${payload.sub}`);

      // 3. Join a school-wide room for broadcast announcements
      client.join(`school_${payload.schoolId}`);

    } catch (error) {
      client.disconnect();
    }

}

/\*\*

- Called by other services (e.g., PdfWorker) to notify a user.
  \*/
  sendUserNotification(userId: string, event: string, payload: any) {
  this.server.to(`user_${userId}`).emit(event, payload);
  }

/\*\*

- Called to broadcast to an entire school (e.g., "Exam Results Published!")
  \*/
  broadcastToSchool(schoolId: string, event: string, payload: any) {
  this.server.to(`school_${schoolId}`).emit(event, payload);
  }
  }
  Usage in a Worker (Example):

TypeScript
// Inside src/modules/reports/workers/pdf.worker.ts
async process(job: Job) {
// ... generate PDF, upload to S3 ...

// Notify the user in real-time that their download is ready
this.notificationsGateway.sendUserNotification(
job.data.userId,
'PDF_READY',
{
message: 'Your Fee Receipt is ready.',
downloadUrl: s3PresignedUrl
}
);
}

---

### Why this file is highly effective for Copilot:

1. **Solves the "Brute Force" Problem:** It gives exact syntax for `@nestjs/throttler` limits tailored to specific routes rather than a blanket limit, directly addressing the project requirements.
2. **Clarifies Multi-Tenancy Execution:** It shows Copilot that `schoolId` must be extracted from the decoded JWT payload (`req.user.schoolId`) and passed explicitly to services.
3. **Standardizes Real-Time Push:** Instead of vague "in-app notifications" which Copilot might try to solve by just writing to a database table, this forces the agent to use standard Socket.io rooms tailored to `userId` and `schoolId`.
4. **Prevents Injection & Corruption:** The DTO validation section forces the agent to always validate input at the boundary, preventing malformed data from reaching services or the database.

---

### ✅ 4. DTO Validation Pattern (class-validator)

Copilot MUST apply strict input validation to every API endpoint. Raw, unvalidated client input is an injection and data corruption vector. NestJS `ValidationPipe` with `class-validator` decorators is the required pattern.

**Global Validation Pipe (register in `main.ts`):**

```typescript
// src/main.ts
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // GLOBAL validation — applies to ALL endpoints automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in the DTO
      forbidNonWhitelisted: true, // Throw error if unknown properties are sent
      transform: true, // Auto-transform payloads to DTO class instances
      transformOptions: {
        enableImplicitConversion: true, // Convert string query params to numbers/booleans
      },
    }),
  );

  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI });
  await app.listen(3000);
}
```

**DTO Example — Payment:**

```typescript
// src/modules/finance/dto/create-payment.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsNumber,
  IsPositive,
  IsEnum,
  Min,
} from "class-validator";

export enum PaymentMethodEnum {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  ONLINE = "ONLINE",
}

export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(1)
  amount: number;

  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @IsUUID()
  @IsNotEmpty()
  idempotencyKey: string; // Required for financial operations (see Finance doc)
}
```

**DTO Example — Student Registration:**

```typescript
// src/modules/students/dto/create-student.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  MaxLength,
  MinLength,
  Matches,
} from "class-validator";

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9\-]+$/, {
    message: "registrationNo must contain only digits and hyphens",
  })
  registrationNo: string; // NEB Registration Number

  @IsDateString()
  dob: string;
}
```

**DTO Example — Login:**

```typescript
// src/modules/auth/dto/login.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
```

**Rules for the agent:**

- Every `@Body()` parameter in a controller MUST reference a class decorated with `class-validator` decorators. NEVER use raw `any`, inline types, or undecorated classes.
- Every `@Query()` and `@Param()` must also be validated. Use `@IsUUID()` for path params that are UUIDs.
- Financial DTOs MUST always include `idempotencyKey` (see Finance & Audit document).
- String fields should always have `@MaxLength()` to prevent payload abuse.
- Numeric fields should always have `@IsPositive()` or `@Min()` where business logic requires it.
- Date fields should use `@IsDateString()` for ISO 8601 format validation.
