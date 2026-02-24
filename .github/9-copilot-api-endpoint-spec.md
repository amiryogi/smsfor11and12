# Context: Complete API Endpoint Specification

## Domain: NEB +2 School Management ERP

This document defines **every** REST API endpoint the agent must implement. Each entry specifies the HTTP method, path, required roles, request DTO, response shape, and any special rules. All endpoints are prefixed with `/api/v1/`.

### 🚨 Global API Rules

1. **Versioning:** All routes are under `/api/v1/`. Use NestJS URI versioning (`@Controller({ path: '...', version: '1' })`).
2. **Authentication:** All endpoints require JWT auth (`@UseGuards(JwtAuthGuard)`) EXCEPT `POST /auth/login` and `POST /auth/refresh`.
3. **Tenant Isolation:** Every authenticated endpoint extracts `schoolId` from the JWT payload (`req.user.schoolId`). Services MUST use this — never accept `schoolId` from the request body.
4. **Pagination:** All `GET` list endpoints MUST support pagination via query params: `?page=1&limit=20&sortBy=createdAt&sortOrder=desc`. Use a shared `PaginationDto`.
5. **Response Shape:** All responses use the standard envelope (see doc 11): `{ success, data, meta?, message? }`.
6. **DTO Validation:** Every request body MUST be validated by a `class-validator` DTO (see doc 6).

---

### 🔐 Auth Module

| Method  | Path                    | Roles  | Description                                                                                   |
| ------- | ----------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `POST`  | `/auth/login`           | Public | Authenticate with email + password. Returns access + refresh tokens. Rate limited: 5 req/min. |
| `POST`  | `/auth/refresh`         | Public | Exchange refresh token for new access token. Rate limited: 10 req/min.                        |
| `POST`  | `/auth/logout`          | Any    | Invalidate the current refresh token.                                                         |
| `GET`   | `/auth/me`              | Any    | Return the current user's profile from JWT.                                                   |
| `PATCH` | `/auth/change-password` | Any    | Change own password. Requires `currentPassword` + `newPassword`.                              |

**Login Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "user": {
      "id": "uuid",
      "email": "admin@school.np",
      "role": "ADMIN",
      "schoolId": "uuid",
      "firstName": "Ram",
      "lastName": "Sharma"
    }
  }
}
```

---

### 👥 Users Module

| Method   | Path         | Roles              | Description                                                                    |
| -------- | ------------ | ------------------ | ------------------------------------------------------------------------------ |
| `GET`    | `/users`     | ADMIN, SUPER_ADMIN | List all users for the school. Supports `?role=TEACHER` filter.                |
| `POST`   | `/users`     | ADMIN              | Create a new user (teacher, accountant, etc.). Sends welcome email via BullMQ. |
| `GET`    | `/users/:id` | ADMIN              | Get a single user's profile.                                                   |
| `PATCH`  | `/users/:id` | ADMIN              | Update user details (name, phone, role, isActive).                             |
| `DELETE` | `/users/:id` | ADMIN              | Soft-delete a user.                                                            |

**Create User DTO:**

```typescript
export class CreateUserDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsString() @MaxLength(100) firstName: string;
  @IsString() @MaxLength(100) lastName: string;
  @IsEnum(Role) role: Role;
  @IsOptional() @IsString() phone?: string;
}
```

---

### 🏫 Schools Module

| Method  | Path               | Roles       | Description                                         |
| ------- | ------------------ | ----------- | --------------------------------------------------- |
| `GET`   | `/schools/current` | ADMIN       | Get the current school's profile and config.        |
| `PATCH` | `/schools/current` | ADMIN       | Update school details (name, address, phone, logo). |
| `GET`   | `/schools`         | SUPER_ADMIN | List all schools in the system (super admin only).  |
| `POST`  | `/schools`         | SUPER_ADMIN | Create a new school tenant.                         |

---

### 📅 Academic Module

**Academic Years:**

| Method  | Path                              | Roles          | Description                                                                            |
| ------- | --------------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| `GET`   | `/academic/years`                 | ADMIN, TEACHER | List all academic years.                                                               |
| `POST`  | `/academic/years`                 | ADMIN          | Create a new academic year.                                                            |
| `PATCH` | `/academic/years/:id`             | ADMIN          | Update academic year.                                                                  |
| `POST`  | `/academic/years/:id/set-current` | ADMIN          | Set this year as the current active year. Unsets the previous current year atomically. |

**Terms:**

| Method  | Path                            | Roles          | Description                      |
| ------- | ------------------------------- | -------------- | -------------------------------- |
| `GET`   | `/academic/years/:yearId/terms` | ADMIN, TEACHER | List terms for an academic year. |
| `POST`  | `/academic/years/:yearId/terms` | ADMIN          | Create a new term.               |
| `PATCH` | `/academic/terms/:id`           | ADMIN          | Update a term.                   |

**Grades (Classes/Sections):**

| Method   | Path                   | Roles          | Description                                                   |
| -------- | ---------------------- | -------------- | ------------------------------------------------------------- |
| `GET`    | `/academic/grades`     | ADMIN, TEACHER | List all grades. Supports `?level=11&stream=SCIENCE` filters. |
| `POST`   | `/academic/grades`     | ADMIN          | Create a new grade (level + section + stream).                |
| `PATCH`  | `/academic/grades/:id` | ADMIN          | Update grade details.                                         |
| `DELETE` | `/academic/grades/:id` | ADMIN          | Soft-delete a grade.                                          |

**Subjects:**

| Method   | Path                     | Roles          | Description                                            |
| -------- | ------------------------ | -------------- | ------------------------------------------------------ |
| `GET`    | `/academic/subjects`     | ADMIN, TEACHER | List all subjects. **Cached in Redis (24hr TTL).**     |
| `POST`   | `/academic/subjects`     | ADMIN          | Create a new subject. **Must invalidate Redis cache.** |
| `PATCH`  | `/academic/subjects/:id` | ADMIN          | Update subject. **Must invalidate Redis cache.**       |
| `DELETE` | `/academic/subjects/:id` | ADMIN          | Soft-delete subject. **Must invalidate Redis cache.**  |

**Grade-Subject Assignment:**

| Method   | Path                                 | Roles          | Description                                            |
| -------- | ------------------------------------ | -------------- | ------------------------------------------------------ |
| `GET`    | `/academic/grades/:gradeId/subjects` | ADMIN, TEACHER | List subjects assigned to a grade.                     |
| `POST`   | `/academic/grades/:gradeId/subjects` | ADMIN          | Assign a subject to a grade (with optional teacherId). |
| `PATCH`  | `/academic/grade-subjects/:id`       | ADMIN          | Update assignment (e.g., change teacher).              |
| `DELETE` | `/academic/grade-subjects/:id`       | ADMIN          | Remove a subject assignment.                           |

---

### 🎓 Students Module

| Method   | Path                  | Roles                  | Description                                                                   |
| -------- | --------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| `GET`    | `/students`           | ADMIN, TEACHER         | List students. Supports `?status=ACTIVE&gradeId=uuid&search=name` filters.    |
| `POST`   | `/students`           | ADMIN                  | Register a new student. Creates audit log.                                    |
| `GET`    | `/students/:id`       | ADMIN, TEACHER, PARENT | Get student details with enrollments. PARENT can only see their own children. |
| `PATCH`  | `/students/:id`       | ADMIN                  | Update student details.                                                       |
| `DELETE` | `/students/:id`       | ADMIN                  | Soft-delete (change status to DROPOUT or TRANSFERRED).                        |
| `POST`   | `/students/:id/photo` | ADMIN                  | Upload profile photo (multipart/form-data → S3).                              |

**Enrollment:**

| Method | Path                               | Roles          | Description                                                                 |
| ------ | ---------------------------------- | -------------- | --------------------------------------------------------------------------- |
| `GET`  | `/students/:studentId/enrollments` | ADMIN, TEACHER | List enrollment history for a student.                                      |
| `POST` | `/enrollments`                     | ADMIN          | Enroll a student in a grade for an academic year.                           |
| `GET`  | `/enrollments`                     | ADMIN, TEACHER | List all enrollments. Supports `?gradeId=uuid&academicYearId=uuid`.         |
| `POST` | `/enrollments/bulk-promote`        | ADMIN          | Promote students from Grade 11 to Grade 12. Returns `202 Accepted` + jobId. |

**Parent Linking:**

| Method   | Path                                     | Roles | Description                      |
| -------- | ---------------------------------------- | ----- | -------------------------------- |
| `POST`   | `/students/:studentId/parents`           | ADMIN | Link a parent user to a student. |
| `GET`    | `/students/:studentId/parents`           | ADMIN | List linked parents/guardians.   |
| `DELETE` | `/students/:studentId/parents/:parentId` | ADMIN | Unlink a parent.                 |

---

### 📝 Exams Module

| Method  | Path                          | Roles          | Description                                                                                    |
| ------- | ----------------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `GET`   | `/exams`                      | ADMIN, TEACHER | List exams. Supports `?academicYearId=uuid&status=PUBLISHED`.                                  |
| `POST`  | `/exams`                      | ADMIN          | Create a new exam (status = DRAFT).                                                            |
| `GET`   | `/exams/:id`                  | ADMIN, TEACHER | Get exam details.                                                                              |
| `PATCH` | `/exams/:id`                  | ADMIN          | Update exam (name, dates). Only allowed in DRAFT status.                                       |
| `POST`  | `/exams/:id/open-marks-entry` | ADMIN          | Transition exam: DRAFT → MARKS_ENTRY.                                                          |
| `POST`  | `/exams/:id/finalize`         | ADMIN          | Transition: MARKS_ENTRY → FINALIZED. Bulk computes NEB grades. Returns `202 Accepted` + jobId. |
| `POST`  | `/exams/:id/publish`          | ADMIN          | Transition: FINALIZED → PUBLISHED. Broadcasts WebSocket notification to all parents.           |

**Exam Results (Marks Entry):**

| Method | Path                                        | Roles                           | Description                                                                                  |
| ------ | ------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------- |
| `GET`  | `/exams/:examId/results`                    | ADMIN, TEACHER                  | List all results for an exam. Supports `?gradeSubjectId=uuid&studentId=uuid`.                |
| `POST` | `/exams/:examId/results`                    | ADMIN, TEACHER                  | Enter marks for a single student+subject. Computes NEB grade automatically.                  |
| `POST` | `/exams/:examId/results/bulk`               | ADMIN, TEACHER                  | Bulk enter marks for an entire class+subject. Body is an array. Wrapped in ACID transaction. |
| `GET`  | `/exams/:examId/results/student/:studentId` | ADMIN, TEACHER, PARENT, STUDENT | Get all subject results for one student in one exam. PARENT/STUDENT can only see their own.  |

**Marks Entry DTO:**

```typescript
export class CreateExamResultDto {
  @IsUUID() studentId: string;
  @IsUUID() gradeSubjectId: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  theoryMarksObtained?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  practicalMarksObtained?: number;
}
```

**Grade Computation Rule:** When marks are entered, the service MUST:

1. Calculate theory percentage = `theoryMarksObtained / theoryFullMarks * 100`
2. Calculate practical percentage (if applicable) = `practicalMarksObtained / practicalFullMarks * 100`
3. Call `calculateNebGrade()` from doc 5 for each component
4. If either component is NG, the final subject grade is NG
5. Store all computed values in the `ExamResult` row

---

### 💰 Finance Module

**Fee Structures:**

| Method  | Path                          | Roles             | Description                                                           |
| ------- | ----------------------------- | ----------------- | --------------------------------------------------------------------- |
| `GET`   | `/finance/fee-structures`     | ADMIN, ACCOUNTANT | List fee structures. Supports `?academicYearId=uuid&feeType=TUITION`. |
| `POST`  | `/finance/fee-structures`     | ADMIN             | Create a new fee structure.                                           |
| `PATCH` | `/finance/fee-structures/:id` | ADMIN             | Update fee structure (only if no invoices reference it).              |

**Invoices:**

| Method | Path                              | Roles                     | Description                                                                                    |
| ------ | --------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `GET`  | `/finance/invoices`               | ADMIN, ACCOUNTANT         | List invoices. Supports `?studentId=uuid&status=UNPAID&academicYearId=uuid`.                   |
| `POST` | `/finance/invoices`               | ADMIN, ACCOUNTANT         | Generate invoice for a student. Auto-populates line items from FeeStructure. ACID transaction. |
| `POST` | `/finance/invoices/bulk-generate` | ADMIN                     | Generate invoices for all students in a grade. Returns `202 Accepted` + jobId.                 |
| `GET`  | `/finance/invoices/:id`           | ADMIN, ACCOUNTANT, PARENT | Get invoice with line items. PARENT can only see their children's invoices.                    |

**Payments:**

| Method | Path                            | Roles                     | Description                                                                                                                    |
| ------ | ------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `GET`  | `/finance/payments`             | ADMIN, ACCOUNTANT         | List payments. Supports `?studentId=uuid&invoiceId=uuid`.                                                                      |
| `POST` | `/finance/payments`             | ADMIN, ACCOUNTANT         | Process a payment. **Requires `idempotencyKey`.** ACID transaction. Updates invoice `paidAmount`/`status`. Queues PDF receipt. |
| `GET`  | `/finance/payments/:id`         | ADMIN, ACCOUNTANT, PARENT | Get payment details + receipt download URL.                                                                                    |
| `POST` | `/finance/payments/:id/reverse` | ADMIN                     | Create a reversal entry. **Requires `idempotencyKey`.** ACID transaction. Creates negative payment + audit log.                |

**Payment DTO:**

```typescript
export class CreatePaymentDto {
  @IsUUID() studentId: string;
  @IsUUID() invoiceId: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive() @Min(1) amount: number;
  @IsEnum(PaymentMethod) paymentMethod: PaymentMethod;
  @IsOptional() @IsString() referenceNo?: string;
  @IsOptional() @IsString() notes?: string;
  @IsUUID() idempotencyKey: string;
}
```

---

### 📊 Reports Module

| Method | Path                                                 | Roles                           | Description                                                                                         |
| ------ | ---------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------- |
| `GET`  | `/reports/exam/:examId/grade/:gradeId`               | ADMIN, TEACHER                  | Grade-wide result summary. **Uses read replica.**                                                   |
| `GET`  | `/reports/exam/:examId/student/:studentId/marksheet` | ADMIN, TEACHER, PARENT, STUDENT | Generate and return marksheet PDF. Returns `202 Accepted` + jobId.                                  |
| `POST` | `/reports/exam/:examId/bulk-marksheets`              | ADMIN                           | Generate marksheets for all students in an exam. Returns `202 Accepted` + jobId.                    |
| `GET`  | `/reports/finance/ledger`                            | ADMIN, ACCOUNTANT               | School-wide financial ledger. **Uses read replica.** Supports date range filters.                   |
| `GET`  | `/reports/finance/student/:studentId`                | ADMIN, ACCOUNTANT, PARENT       | Student-specific financial statement.                                                               |
| `GET`  | `/reports/finance/outstanding`                       | ADMIN, ACCOUNTANT               | List students with outstanding balances. **Uses read replica.**                                     |
| `GET`  | `/reports/students/summary`                          | ADMIN                           | School-wide student statistics (active, graduated, dropout counts by grade). **Uses read replica.** |

---

### 🔔 Notifications Module

| Method  | Path                           | Roles | Description                                                               |
| ------- | ------------------------------ | ----- | ------------------------------------------------------------------------- |
| `GET`   | `/notifications`               | Any   | List current user's notifications. Supports `?isRead=false&type=PAYMENT`. |
| `PATCH` | `/notifications/:id/read`      | Any   | Mark a notification as read.                                              |
| `POST`  | `/notifications/mark-all-read` | Any   | Mark all of current user's notifications as read.                         |

**WebSocket Events (via Socket.io namespace `/notifications`):**

| Event              | Direction       | Payload                          | Trigger                                   |
| ------------------ | --------------- | -------------------------------- | ----------------------------------------- |
| `PDF_READY`        | Server → Client | `{ message, downloadUrl }`       | PDF generation job completes              |
| `EXAM_PUBLISHED`   | Server → School | `{ message, examId, examName }`  | Admin publishes exam results              |
| `PAYMENT_RECEIVED` | Server → Client | `{ message, paymentId, amount }` | Payment processed for student's parent    |
| `JOB_FAILED`       | Server → Admins | `{ message, jobId, type }`       | Background job exhausts all retries (DLQ) |

---

### 🩺 Health Module

| Method | Path      | Roles  | Description                                               |
| ------ | --------- | ------ | --------------------------------------------------------- |
| `GET`  | `/health` | Public | Check MySQL + Redis connectivity. Returns `200` or `503`. |

**Response:**

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

---

### 📄 Shared Pagination DTO

```typescript
// src/common/dto/pagination.dto.ts
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from "class-validator";
import { Type } from "class-transformer";

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}
```

**Paginated Response Shape:**

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### 🚨 Rules for the Agent

1. **Endpoint completeness:** Every route listed above MUST be implemented. Do not skip endpoints or leave them as stubs.
2. **Role enforcement:** Every endpoint MUST have `@RequireRoles(...)` with the exact roles listed in the table. Missing role decorators are a security hole.
3. **PARENT/STUDENT isolation:** These roles can ONLY access data related to themselves or their linked students. The service must verify ownership, not just `schoolId`.
4. **Status transitions are one-way:** Exam status (DRAFT→MARKS_ENTRY→FINALIZED→PUBLISHED) can only move forward. Implement guard logic in the service.
5. **Async endpoints:** Any endpoint returning `202 Accepted` MUST return `{ success: true, data: { jobId: "uuid" }, message: "Processing started" }`.
6. **Financial endpoints are ACID:** Every `POST` in the Finance module (payments, invoices) MUST use `prisma.$transaction`. No exceptions.
