# Context: Testing Strategy & Patterns

## Domain: NEB +2 School Management ERP

This document defines the testing approach, tooling, and patterns for both backend and frontend. The agent MUST write tests when creating new features and follow these conventions.

### 🛠 Testing Stack

- **Backend:** Jest + `@nestjs/testing` + Supertest (E2E)
- **Frontend:** Vitest + React Testing Library
- **Database:** Separate test MySQL database (not in-memory)
- **Mocks:** Manual mocks for external services (S3, BullMQ, Redis)

### 🚨 Strict Testing Rules

1. **Test coverage is required.** Every service method and controller endpoint MUST have at least one unit test. Critical paths (financial operations, exam grading) must have comprehensive tests.
2. **No production database.** Tests MUST use a separate test database (`DATABASE_URL` from `.env.test`). NEVER run tests against development or production databases.
3. **Tests are isolated.** Each test file must clean up after itself. Use transactions that roll back, or truncate tables in `beforeEach`.
4. **Mock external services.** S3, BullMQ queues, and email services MUST be mocked in unit tests. Only E2E tests may use real Redis.
5. **Test the domain, not the framework.** Don't test that NestJS routing works. Test that your business logic (NEB grading, payment processing, audit logging) is correct.

---

### ⚙️ 1. Backend Test Configuration

**Jest config:**

```typescript
// backend/jest.config.ts
import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: [
    "**/*.service.ts",
    "**/*.util.ts",
    "!**/node_modules/**",
    "!**/dist/**",
  ],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/$1",
  },
};

export default config;
```

**E2E config:**

```typescript
// backend/test/jest-e2e.config.ts
import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "..",
  testRegex: ".e2e-spec.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  testEnvironment: "node",
  setupFilesAfterSetup: ["./test/setup.ts"],
};

export default config;
```

**Test environment (.env.test):**

```env
# .env.test — Used by test runner
DATABASE_URL="mysql://sms_user:sms_password@localhost:3306/sms_erp_test"
DATABASE_REPLICA_URL="mysql://sms_user:sms_password@localhost:3306/sms_erp_test"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=test-jwt-secret-key-32-chars-long!!
JWT_REFRESH_SECRET=test-refresh-secret-32-chars-long!
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET_NAME=sms-test-bucket
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

---

### 🏭 2. Test Data Factories

The agent MUST use factory functions to generate test data. NEVER hardcode UUIDs or create test data inline.

```typescript
// test/factories/school.factory.ts
import { v4 as uuidv4 } from "uuid";

export function createMockSchool(overrides: Partial<any> = {}) {
  return {
    id: uuidv4(),
    name: "Test Secondary School",
    code: `NEB-TEST-${Math.floor(Math.random() * 10000)}`,
    address: "Kathmandu, Nepal",
    phone: "+977-01-0000000",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}
```

```typescript
// test/factories/student.factory.ts
import { v4 as uuidv4 } from "uuid";

export function createMockStudent(
  schoolId: string,
  overrides: Partial<any> = {},
) {
  return {
    id: uuidv4(),
    schoolId,
    registrationNo: `REG-${Math.floor(Math.random() * 100000)}`,
    firstName: "Ram",
    lastName: "Sharma",
    dob: new Date("2008-01-15"),
    gender: "MALE",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}
```

```typescript
// test/factories/user.factory.ts
import { v4 as uuidv4 } from "uuid";
import { Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

export function createMockUser(schoolId: string, overrides: Partial<any> = {}) {
  return {
    id: uuidv4(),
    schoolId,
    email: `user-${Math.floor(Math.random() * 10000)}@test.np`,
    passwordHash: bcrypt.hashSync("Test@123", 10),
    firstName: "Test",
    lastName: "User",
    role: Role.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}
```

```typescript
// test/factories/payment.factory.ts
import { v4 as uuidv4 } from "uuid";

export function createMockPayment(
  schoolId: string,
  studentId: string,
  overrides: Partial<any> = {},
) {
  return {
    id: uuidv4(),
    schoolId,
    studentId,
    invoiceId: null,
    amount: 5000.0,
    paymentMethod: "CASH",
    status: "COMPLETED",
    receiptUrl: null,
    receiptS3Key: null,
    reversalOfId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}
```

---

### 🧪 3. Unit Test Patterns

**Service Unit Test (with mocked Prisma):**

```typescript
// src/modules/students/students.service.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { StudentsService } from "./students.service";
import { PrismaService } from "../../core/prisma/prisma.service";
import { AuditService } from "../../core/audit/audit.service";
import { createMockSchool } from "../../../test/factories/school.factory";
import { createMockStudent } from "../../../test/factories/student.factory";
import {
  StudentNotFoundException,
  DuplicateRegistrationException,
} from "../../common/exceptions/business.exceptions";

describe("StudentsService", () => {
  let service: StudentsService;
  let prisma: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AuditService>;

  const mockSchool = createMockSchool();
  const mockStudent = createMockStudent(mockSchool.id);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        {
          provide: PrismaService,
          useValue: {
            student: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            $transaction: jest.fn((fn) => fn(prisma)),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(StudentsService);
    prisma = module.get(PrismaService);
    auditService = module.get(AuditService);
  });

  describe("findOne", () => {
    it("should return a student when found", async () => {
      prisma.student.findUnique.mockResolvedValue(mockStudent);

      const result = await service.findOne(mockSchool.id, mockStudent.id);

      expect(result).toEqual(mockStudent);
      expect(prisma.student.findUnique).toHaveBeenCalledWith({
        where: { id: mockStudent.id, schoolId: mockSchool.id },
      });
    });

    it("should throw StudentNotFoundException when not found", async () => {
      prisma.student.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne(mockSchool.id, "nonexistent-id"),
      ).rejects.toThrow(StudentNotFoundException);
    });
  });

  describe("create", () => {
    it("should create a student and log audit entry", async () => {
      prisma.student.create.mockResolvedValue(mockStudent);

      const result = await service.create(
        mockSchool.id,
        {
          firstName: "Ram",
          lastName: "Sharma",
          registrationNo: "REG-001",
          dob: "2008-01-15",
          gender: "MALE",
        },
        "admin-user-id",
      );

      expect(result).toEqual(mockStudent);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          schoolId: mockSchool.id,
          entityName: "Student",
          action: "CREATE",
        }),
        expect.anything(), // transaction client
      );
    });

    it("should throw DuplicateRegistrationException on conflict", async () => {
      prisma.student.create.mockRejectedValue({ code: "P2002" }); // Prisma unique constraint

      await expect(
        service.create(
          mockSchool.id,
          {
            firstName: "Ram",
            lastName: "Sharma",
            registrationNo: "REG-DUPLICATE",
            dob: "2008-01-15",
            gender: "MALE",
          },
          "admin-user-id",
        ),
      ).rejects.toThrow(DuplicateRegistrationException);
    });
  });
});
```

---

### 🧮 4. NEB Grading Utility Tests

This is the most critical unit — wrong grading logic affects all students' results. Test EVERY boundary.

```typescript
// src/modules/exams/utils/neb-grading.util.spec.ts
import { calculateNebGrade } from "./neb-grading.util";

describe("calculateNebGrade", () => {
  // ==========================================
  // THEORY GRADING (passing threshold: 35%)
  // ==========================================
  describe("Theory grades", () => {
    it.each([
      [100, "A+", 4.0],
      [95, "A+", 4.0],
      [90, "A+", 4.0],
      [89, "A", 3.6],
      [80, "A", 3.6],
      [79, "B+", 3.2],
      [70, "B+", 3.2],
      [69, "B", 2.8],
      [60, "B", 2.8],
      [59, "C+", 2.4],
      [50, "C+", 2.4],
      [49, "C", 2.0],
      [40, "C", 2.0],
      [39, "D", 1.6],
      [35, "D", 1.6],
    ])(
      "should grade %d%% as %s (%f)",
      (percentage, expectedGrade, expectedGP) => {
        const result = calculateNebGrade(percentage, false);
        expect(result.letterGrade).toBe(expectedGrade);
        expect(result.gradePoint).toBe(expectedGP);
        expect(result.isNg).toBe(false);
      },
    );

    it.each([34, 20, 10, 0])(
      "should grade %d%% as NG for theory",
      (percentage) => {
        const result = calculateNebGrade(percentage, false);
        expect(result.letterGrade).toBe("NG");
        expect(result.gradePoint).toBeNull();
        expect(result.isNg).toBe(true);
      },
    );
  });

  // ==========================================
  // PRACTICAL GRADING (passing threshold: 40%)
  // ==========================================
  describe("Practical grades", () => {
    it("should pass practical at 40%", () => {
      const result = calculateNebGrade(40, true);
      expect(result.letterGrade).toBe("C");
      expect(result.isNg).toBe(false);
    });

    it("should fail practical at 39%", () => {
      const result = calculateNebGrade(39, true);
      expect(result.letterGrade).toBe("NG");
      expect(result.isNg).toBe(true);
    });

    it("should NOT grant D grade for practical (35-39%)", () => {
      // Practical has no D range — 35-39% is NG for practical
      const result = calculateNebGrade(37, true);
      expect(result.letterGrade).toBe("NG");
      expect(result.isNg).toBe(true);
    });
  });

  // ==========================================
  // BOUNDARY CONDITIONS
  // ==========================================
  describe("Boundary conditions", () => {
    it("should handle exactly 0%", () => {
      const result = calculateNebGrade(0, false);
      expect(result.isNg).toBe(true);
    });

    it("should handle exactly 100%", () => {
      const result = calculateNebGrade(100, false);
      expect(result.letterGrade).toBe("A+");
      expect(result.gradePoint).toBe(4.0);
    });

    it("should handle decimal percentages", () => {
      const result = calculateNebGrade(89.9, false);
      expect(result.letterGrade).toBe("A");
    });
  });
});
```

---

### 💰 5. Financial Service Tests (ACID & Idempotency)

```typescript
// src/modules/finance/payment.service.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { PaymentService } from "./payment.service";
import { PrismaService } from "../../core/prisma/prisma.service";
import { AuditService } from "../../core/audit/audit.service";
import { IdempotencyService } from "./idempotency.service";
import { getQueueToken } from "@nestjs/bullmq";
import { createMockSchool } from "../../../test/factories/school.factory";
import { createMockStudent } from "../../../test/factories/student.factory";
import { createMockPayment } from "../../../test/factories/payment.factory";
import {
  StudentNotFoundException,
  PaymentExceedsBalanceException,
} from "../../common/exceptions/business.exceptions";

describe("PaymentService", () => {
  let service: PaymentService;
  let prisma: any;
  let idempotencyService: jest.Mocked<IdempotencyService>;
  let pdfQueue: { add: jest.MockedFunction<any> };

  const school = createMockSchool();
  const student = createMockStudent(school.id);

  beforeEach(async () => {
    pdfQueue = { add: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((fn) =>
              fn({
                student: { findUnique: jest.fn().mockResolvedValue(student) },
                payment: {
                  create: jest
                    .fn()
                    .mockResolvedValue(
                      createMockPayment(school.id, student.id),
                    ),
                },
                invoice: { update: jest.fn() },
              }),
            ),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: IdempotencyService,
          useValue: {
            checkExisting: jest.fn().mockResolvedValue(null),
            recordResponse: jest.fn(),
          },
        },
        {
          provide: getQueueToken("pdf-generation"),
          useValue: pdfQueue,
        },
      ],
    }).compile();

    service = module.get(PaymentService);
    prisma = module.get(PrismaService);
    idempotencyService = module.get(IdempotencyService);
  });

  describe("processPayment", () => {
    it("should process payment and queue PDF receipt", async () => {
      const result = await service.processPayment(
        school.id,
        student.id,
        5000,
        "admin-id",
        "idempotency-key-1",
      );

      expect(result).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(pdfQueue.add).toHaveBeenCalledWith(
        "generate-receipt",
        expect.objectContaining({ schoolId: school.id, type: "FEE_RECEIPT" }),
        expect.objectContaining({ attempts: 3 }),
      );
    });

    it("should return cached response for duplicate idempotency key", async () => {
      const cachedPayment = createMockPayment(school.id, student.id);
      idempotencyService.checkExisting.mockResolvedValue({
        statusCode: 201,
        body: cachedPayment,
      });

      const result = await service.processPayment(
        school.id,
        student.id,
        5000,
        "admin-id",
        "duplicate-key",
      );

      expect(result).toEqual(cachedPayment);
      expect(prisma.$transaction).not.toHaveBeenCalled(); // Should NOT process again
      expect(pdfQueue.add).not.toHaveBeenCalled(); // Should NOT queue again
    });

    it("should throw StudentNotFoundException for invalid student", async () => {
      prisma.$transaction.mockImplementation((fn: any) =>
        fn({
          student: { findUnique: jest.fn().mockResolvedValue(null) },
          payment: { create: jest.fn() },
        }),
      );

      await expect(
        service.processPayment(
          school.id,
          "nonexistent",
          5000,
          "admin-id",
          "key-1",
        ),
      ).rejects.toThrow(StudentNotFoundException);
    });
  });
});
```

---

### 🌐 6. E2E Test Patterns

E2E tests verify the full HTTP request/response cycle including auth, validation, and database.

```typescript
// test/students.e2e-spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/core/prisma/prisma.service";

describe("Students (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let schoolId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Seed test data and get auth token
    const school = await prisma.school.create({
      data: { name: "E2E Test School", code: "E2E-001" },
    });
    schoolId = school.id;

    // Create admin user and login to get token
    // (simplified — use the auth endpoint)
    const loginResponse = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "admin@e2e.np", password: "Admin@123" });
    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.student.deleteMany({ where: { schoolId } });
    await prisma.school.delete({ where: { id: schoolId } });
    await app.close();
  });

  describe("POST /api/v1/students", () => {
    it("should create a student with valid data", () => {
      return request(app.getHttpServer())
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          firstName: "Ram",
          lastName: "Sharma",
          registrationNo: "REG-E2E-001",
          dob: "2008-01-15",
          gender: "MALE",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.firstName).toBe("Ram");
          expect(res.body.data.schoolId).toBe(schoolId);
        });
    });

    it("should reject invalid registration number", () => {
      return request(app.getHttpServer())
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          firstName: "Sita",
          lastName: "KC",
          registrationNo: "invalid spaces!",
          dob: "2008-05-20",
          gender: "FEMALE",
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("VALIDATION_ERROR");
        });
    });

    it("should reject request without auth token", () => {
      return request(app.getHttpServer())
        .post("/api/v1/students")
        .send({ firstName: "Ram", lastName: "Sharma" })
        .expect(401);
    });

    it("should reject forbidden properties (whitelisting)", () => {
      return request(app.getHttpServer())
        .post("/api/v1/students")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          firstName: "Ram",
          lastName: "Sharma",
          registrationNo: "REG-E2E-002",
          dob: "2008-01-15",
          gender: "MALE",
          schoolId: "hacker-school-id", // Should be rejected — schoolId comes from JWT
        })
        .expect(400);
    });
  });

  describe("GET /api/v1/students", () => {
    it("should return paginated list", () => {
      return request(app.getHttpServer())
        .get("/api/v1/students?page=1&limit=10")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.meta).toBeDefined();
          expect(res.body.meta.page).toBe(1);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });
});
```

---

### ⚛️ 7. Frontend Test Patterns

**Component test (with React Testing Library + MSW or mocked hooks):**

```typescript
// src/pages/students/__tests__/StudentsListPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { StudentsListPage } from '../StudentsListPage';
import { vi } from 'vitest';

// Mock the hook
vi.mock('../../../hooks/useStudents', () => ({
  useStudents: vi.fn(),
}));

import { useStudents } from '../../../hooks/useStudents';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('StudentsListPage', () => {
  it('should show loading state', () => {
    (useStudents as any).mockReturnValue({ isLoading: true, data: null, isError: false });

    renderWithProviders(<StudentsListPage />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should show error state', () => {
    (useStudents as any).mockReturnValue({ isLoading: false, data: null, isError: true });

    renderWithProviders(<StudentsListPage />);
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });

  it('should render student data', async () => {
    (useStudents as any).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        success: true,
        data: [
          { id: '1', firstName: 'Ram', lastName: 'Sharma', status: 'ACTIVE', registrationNo: 'REG-001' },
        ],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });

    renderWithProviders(<StudentsListPage />);
    await waitFor(() => {
      expect(screen.getByText('Ram')).toBeInTheDocument();
      expect(screen.getByText('Sharma')).toBeInTheDocument();
    });
  });
});
```

---

### 📋 8. What to Test (Checklist by Module)

| Module                     | Must Test                                                                                                        | Priority    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------- |
| **NEB Grading Utility**    | Every grade boundary (35%, 40%, 50%, 60%, 70%, 80%, 90%), theory vs practical, NG logic                          | 🔴 Critical |
| **Payment Service**        | ACID transaction, idempotency (duplicate key returns cached), reversal creates negative entry, audit log created | 🔴 Critical |
| **Exam Service**           | Status transitions (DRAFT→MARKS_ENTRY→FINALIZED→PUBLISHED), invalid transitions rejected, bulk grade computation | 🔴 Critical |
| **Soft-Delete Extension**  | `findMany` excludes soft-deleted, `delete` sets `deletedAt`, count excludes soft-deleted                         | 🔴 Critical |
| **Auth Service**           | Login success, invalid credentials, rate limiting, JWT token generation, refresh flow                            | 🟡 High     |
| **Student Service**        | CRUD, duplicate registrationNo rejected, enrollment, parent linking                                              | 🟡 High     |
| **Invoice Service**        | Line item calculation, partial payments update status, overdue detection                                         | 🟡 High     |
| **School Isolation Guard** | Cross-tenant access blocked, same-tenant access allowed                                                          | 🟡 High     |
| **DLQ Handler**            | Failed job moved to DLQ, admin notified, retry works                                                             | 🟢 Medium   |
| **DTO Validation**         | Required fields, type validation, whitelist rejects unknown                                                      | 🟢 Medium   |
| **Frontend Hooks**         | Query key invalidation on mutation, loading/error states                                                         | 🟢 Medium   |

---

### 🏃 9. Running Tests

```bash
# Backend unit tests
cd backend
pnpm test

# Backend unit tests in watch mode
pnpm test:watch

# Backend test coverage
pnpm test:cov

# Backend E2E tests
pnpm test:e2e

# Frontend tests
cd frontend
pnpm test

# Frontend with coverage
pnpm test -- --coverage
```

Add to **backend/package.json**:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.config.ts"
  }
}
```

---

### 🧹 10. Test Database Setup

```typescript
// test/setup.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * Utility: Clean all tables between test suites.
 * Respects FK constraints by deleting in reverse dependency order.
 */
export async function cleanDatabase() {
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.examResult.deleteMany(),
    prisma.exam.deleteMany(),
    prisma.gradeSubject.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.invoiceLineItem.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.feeStructure.deleteMany(),
    prisma.fileAsset.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.idempotencyRecord.deleteMany(),
    prisma.studentParent.deleteMany(),
    prisma.student.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.grade.deleteMany(),
    prisma.term.deleteMany(),
    prisma.academicYear.deleteMany(),
    prisma.user.deleteMany(),
    prisma.school.deleteMany(),
  ]);
}
```

---

### 🚨 Rules for the Agent

1. **Every new service method MUST have a corresponding `.spec.ts` file.** Don't create services without tests.
2. **Test file lives next to the source file.** `payment.service.ts` → `payment.service.spec.ts`.
3. **Use factories, not hardcoded data.** Call `createMockStudent()` not `{ id: 'abc', firstName: 'Ram' }`.
4. **Test error paths, not just happy paths.** Every `throw` in a service must have a test that expects that exception.
5. **Test NEB grading at EVERY boundary.** This is the most Nepal-specific and error-prone logic in the system.
6. **Financial tests must verify idempotency.** Every payment test suite must include a "duplicate key returns cached" test case.
7. **E2E tests verify the full stack.** Auth → validation → service → database → response shape. At minimum: one success case and one validation failure per endpoint.
