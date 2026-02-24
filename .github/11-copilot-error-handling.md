# Context: Error Handling & Response Standards

## Domain: NEB +2 School Management ERP

This document defines the standard API response format, global exception handling, and custom business exception classes. The agent MUST follow these patterns so every endpoint returns consistent, predictable responses.

### 🚨 Strict Rules

1. **Uniform Response Envelope:** EVERY API response (success or error) MUST use the standard envelope shape. No raw data, no inconsistent formats.
2. **Global Exception Filter:** A single `GlobalExceptionFilter` handles ALL unhandled exceptions. Individual controllers must NOT have custom `try/catch` blocks for generic errors.
3. **Business Exceptions:** Domain-specific errors (e.g., "exam already finalized", "insufficient balance") MUST use custom exception classes, not generic `BadRequestException` with string messages.
4. **Never Expose Internals:** Stack traces, SQL errors, and internal details must NEVER appear in production API responses. Log them server-side with structured logging (pino).
5. **HTTP Status Codes are Semantic:** Use the correct status code for each scenario — do not return `200` for everything.

---

### ✅ 1. Standard Response Envelope

All API responses MUST conform to one of these two shapes:

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "message": "Student created successfully"
}
```

- `success`: Always `true` for 2xx responses.
- `data`: The actual response payload. Object for single items, array for lists.
- `meta`: ONLY present for paginated list endpoints.
- `message`: Optional human-readable message (useful for mutations).

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "STUDENT_NOT_FOUND",
    "message": "Student with the given ID does not exist",
    "details": [{ "field": "studentId", "message": "must be a valid UUID" }]
  },
  "statusCode": 404
}
```

- `success`: Always `false` for 4xx/5xx responses.
- `error.code`: A machine-readable error code (uppercase snake_case). Used by the frontend for i18n and conditional handling.
- `error.message`: Human-readable error description.
- `error.details`: Optional array for validation errors (one entry per field).
- `statusCode`: The HTTP status code, mirrored in the body for convenience.

---

### 🔧 2. Response Transform Interceptor

This interceptor wraps all successful responses in the standard envelope automatically. Controllers just return raw data.

```typescript
// src/common/interceptors/response-transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, map } from "rxjs";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: any;
  message?: string;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((responseData) => {
        // If the service already returned the envelope shape, pass through
        if (responseData?.success !== undefined) {
          return responseData;
        }

        // Auto-wrap raw return values
        return {
          success: true,
          data: responseData,
        };
      }),
    );
  }
}
```

**Register globally in `main.ts`:**

```typescript
app.useGlobalInterceptors(new ResponseTransformInterceptor());
```

**Usage — controllers just return data:**

```typescript
// The interceptor wraps this into { success: true, data: student }
@Get(':id')
async getStudent(@Param('id') id: string, @Request() req) {
  return this.studentsService.findOne(req.user.schoolId, id);
}
```

**For paginated responses, the service returns the full shape:**

```typescript
// Service returns this directly (interceptor passes it through)
async findAll(schoolId: string, pagination: PaginationDto) {
  const [data, total] = await Promise.all([
    this.prisma.student.findMany({
      where: { schoolId },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
    }),
    this.prisma.student.count({ where: { schoolId } }),
  ]);

  return {
    success: true,
    data,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}
```

---

### 🛡️ 3. Global Exception Filter

This filter catches ALL exceptions and formats them into the standard error envelope. Register it globally.

```typescript
// src/common/filters/global-exception.filter.ts
import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request, Response } from "express";

@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = "INTERNAL_ERROR";
    let message = "An unexpected error occurred";
    let details: any[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      // Handle class-validator validation errors
      if (statusCode === HttpStatus.BAD_REQUEST && exceptionResponse?.message) {
        if (Array.isArray(exceptionResponse.message)) {
          errorCode = "VALIDATION_ERROR";
          message = "Validation failed";
          details = exceptionResponse.message.map((msg: string) => ({
            message: msg,
          }));
        } else {
          errorCode = exceptionResponse.errorCode || "BAD_REQUEST";
          message = exceptionResponse.message || message;
        }
      } else {
        // Handle custom business exceptions
        errorCode =
          exceptionResponse.errorCode || this.statusToCode(statusCode);
        message = exceptionResponse.message || message;
        details = exceptionResponse.details;
      }
    }

    // Structured logging for monitoring (Pino)
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
        {
          statusCode,
          errorCode,
          path: request.url,
          method: request.method,
          schoolId: (request as any).user?.schoolId,
          userId: (request as any).user?.sub,
        },
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} → ${statusCode}: ${message}`,
        {
          statusCode,
          errorCode,
          path: request.url,
        },
      );
    }

    response.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
      },
      statusCode,
    });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "UNPROCESSABLE_ENTITY",
      429: "TOO_MANY_REQUESTS",
      500: "INTERNAL_ERROR",
    };
    return map[status] || "UNKNOWN_ERROR";
  }
}
```

**Register globally in `main.ts`:**

```typescript
import { HttpAdapterHost } from "@nestjs/core";

const { httpAdapter } = app.get(HttpAdapterHost);
app.useGlobalFilters(new GlobalExceptionFilter(httpAdapter));
```

---

### 🏷️ 4. Custom Business Exception Classes

The agent MUST throw these custom exceptions instead of generic `BadRequestException('some string')`. This ensures the frontend can match on `error.code` for conditional handling.

```typescript
// src/common/exceptions/business.exceptions.ts
import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Base class for all business exceptions.
 * Provides a machine-readable errorCode for frontend consumption.
 */
export class BusinessException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: any[],
  ) {
    super({ errorCode, message, details }, statusCode);
  }
}

// ==========================================
// STUDENT DOMAIN
// ==========================================

export class StudentNotFoundException extends BusinessException {
  constructor(studentId: string) {
    super(
      "STUDENT_NOT_FOUND",
      `Student with ID ${studentId} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class DuplicateRegistrationException extends BusinessException {
  constructor(registrationNo: string) {
    super(
      "DUPLICATE_REGISTRATION",
      `A student with registration number ${registrationNo} already exists`,
      HttpStatus.CONFLICT,
    );
  }
}

export class StudentAlreadyEnrolledException extends BusinessException {
  constructor() {
    super(
      "STUDENT_ALREADY_ENROLLED",
      "Student is already enrolled for this academic year",
      HttpStatus.CONFLICT,
    );
  }
}

// ==========================================
// EXAM DOMAIN
// ==========================================

export class ExamNotFoundException extends BusinessException {
  constructor(examId: string) {
    super(
      "EXAM_NOT_FOUND",
      `Exam with ID ${examId} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class InvalidExamStatusTransition extends BusinessException {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      "INVALID_EXAM_STATUS_TRANSITION",
      `Cannot transition exam from ${currentStatus} to ${targetStatus}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class ExamAlreadyFinalizedException extends BusinessException {
  constructor() {
    super(
      "EXAM_ALREADY_FINALIZED",
      "This exam has already been finalized and cannot be modified",
      HttpStatus.CONFLICT,
    );
  }
}

export class MarksExceedMaximum extends BusinessException {
  constructor(field: string, max: number) {
    super(
      "MARKS_EXCEED_MAXIMUM",
      `${field} cannot exceed ${max}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

// ==========================================
// FINANCE DOMAIN
// ==========================================

export class InvoiceNotFoundException extends BusinessException {
  constructor(invoiceId: string) {
    super(
      "INVOICE_NOT_FOUND",
      `Invoice with ID ${invoiceId} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class PaymentExceedsBalanceException extends BusinessException {
  constructor(remaining: number) {
    super(
      "PAYMENT_EXCEEDS_BALANCE",
      `Payment amount exceeds outstanding balance of ${remaining}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class PaymentAlreadyReversedException extends BusinessException {
  constructor() {
    super(
      "PAYMENT_ALREADY_REVERSED",
      "This payment has already been reversed",
      HttpStatus.CONFLICT,
    );
  }
}

export class IdempotencyKeyMissingException extends BusinessException {
  constructor() {
    super(
      "IDEMPOTENCY_KEY_MISSING",
      "idempotencyKey is required for financial operations",
      HttpStatus.BAD_REQUEST,
    );
  }
}

// ==========================================
// AUTH & ACCESS
// ==========================================

export class InvalidCredentialsException extends BusinessException {
  constructor() {
    super(
      "INVALID_CREDENTIALS",
      "Invalid email or password",
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AccountDeactivatedException extends BusinessException {
  constructor() {
    super(
      "ACCOUNT_DEACTIVATED",
      "This account has been deactivated. Contact your administrator.",
      HttpStatus.FORBIDDEN,
    );
  }
}

export class TenantAccessDeniedException extends BusinessException {
  constructor() {
    super(
      "TENANT_ACCESS_DENIED",
      "You do not have access to this resource",
      HttpStatus.FORBIDDEN,
    );
  }
}

export class GradeSectionFullException extends BusinessException {
  constructor(level: number, section: string) {
    super(
      "GRADE_SECTION_FULL",
      `Grade ${level} Section ${section} has reached maximum capacity`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
```

**Usage in services:**

```typescript
// CORRECT — throw custom exception
if (!student) throw new StudentNotFoundException(studentId);

// WRONG — never do this
if (!student) throw new BadRequestException("Student not found");
```

---

### 📊 5. HTTP Status Code Convention

| Status                      | When to Use                               | Example                                                     |
| --------------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| `200 OK`                    | Successful GET, PATCH                     | `GET /students`, `PATCH /students/:id`                      |
| `201 Created`               | Successful POST that creates a resource   | `POST /students`, `POST /finance/payments`                  |
| `202 Accepted`              | Async job queued                          | `POST /exams/:id/finalize`, `POST /reports/bulk-marksheets` |
| `204 No Content`            | Successful DELETE                         | `DELETE /students/:id` (actually soft-delete)               |
| `400 Bad Request`           | Validation error, missing idempotency key | Invalid DTO                                                 |
| `401 Unauthorized`          | Missing or expired JWT                    | No/invalid token                                            |
| `403 Forbidden`             | Valid JWT but wrong role or wrong tenant  | TEACHER accessing ADMIN endpoint                            |
| `404 Not Found`             | Resource doesn't exist                    | Student ID not in DB                                        |
| `409 Conflict`              | Duplicate or already-processed            | Duplicate registration, payment already reversed            |
| `422 Unprocessable Entity`  | Invalid business logic                    | Marks exceed max, invalid status transition                 |
| `429 Too Many Requests`     | Rate limit exceeded                       | Login throttling                                            |
| `500 Internal Server Error` | Unexpected server failure                 | Unhandled exceptions                                        |

---

### 📝 6. Complete `main.ts` Bootstrap

This is the definitive `main.ts` combining all global configurations:

```typescript
// src/main.ts
import { NestFactory, HttpAdapterHost } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { ResponseTransformInterceptor } from "./common/interceptors/response-transform.interceptor";
import { Logger } from "nestjs-pino";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Structured logging
  app.useLogger(app.get(Logger));

  // API prefix and versioning
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI });

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global response transform
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // Global exception filter
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapter));

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
```

---

### 🚨 Rules for the Agent

1. **NEVER use generic exception messages.** Always throw a custom `BusinessException` subclass with a machine-readable `errorCode`.
2. **NEVER catch exceptions in controllers.** Let the `GlobalExceptionFilter` handle all errors uniformly.
3. **NEVER return raw data from controllers.** The `ResponseTransformInterceptor` wraps it. For paginated data, return the full envelope from the service.
4. **EVERY new domain exception** must be added to `business.exceptions.ts` following the same pattern: class name, errorCode, message, statusCode.
5. **Frontend error handling** should match on `error.code` (e.g., `STUDENT_NOT_FOUND`), never on `error.message` strings which may change.
