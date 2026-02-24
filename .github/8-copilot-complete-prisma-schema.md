# Context: Complete Prisma Schema (All Domain Models)

## Domain: NEB +2 School Management ERP

This document provides the **complete** Prisma schema covering ALL domain models. Document 2 (`2-copilot-database-schema.md`) defines the baseline models and ORM rules. This document **extends** that baseline with every model needed to build the full system.

### 🚨 Reminder: Schema Rules (from Doc 2)

- Every model has `schoolId` (except `School` itself).
- Every model has `deletedAt DateTime?` for soft deletes.
- All `id` fields are `String @id @default(uuid())`.
- Composite indexes on `[schoolId, deletedAt]` for all tenant tables.
- The soft-delete extension automatically filters `deletedAt IS NULL`.

---

### 🗄 Complete Prisma Schema

This is the **full** schema. The agent must use this as the single source of truth. It includes all models from doc 2 plus the Academic, Enrollment, Exam, Invoice, Notification, and Idempotency domains.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ==========================================
// 🏫 TENANT & USERS
// ==========================================

model School {
  id        String    @id @default(uuid())
  name      String
  code      String    @unique // NEB School Code
  address   String?
  phone     String?
  logoS3Key String?            // S3 key for school logo

  users          User[]
  students       Student[]
  academicYears  AcademicYear[]
  grades         Grade[]
  subjects       Subject[]
  exams          Exam[]
  feeStructures  FeeStructure[]
  invoices       Invoice[]
  payments       Payment[]
  notifications  Notification[]
  auditLogs      AuditLog[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
}

model User {
  id           String    @id @default(uuid())
  schoolId     String
  school       School    @relation(fields: [schoolId], references: [id])

  email        String    @unique
  passwordHash String
  firstName    String
  lastName     String
  phone        String?
  profilePicS3Key String?       // S3 key for profile picture
  role         Role      @default(TEACHER)
  isActive     Boolean   @default(true)

  // A User with role PARENT can be linked to students
  parentStudents StudentParent[]

  auditLogs    AuditLog[]
  notifications Notification[]

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  @@index([schoolId, deletedAt])
  @@index([schoolId, role])
}

enum Role {
  SUPER_ADMIN
  ADMIN
  TEACHER
  ACCOUNTANT
  PARENT
  STUDENT
}

// ==========================================
// 📅 ACADEMIC STRUCTURE
// ==========================================

model AcademicYear {
  id        String    @id @default(uuid())
  schoolId  String
  school    School    @relation(fields: [schoolId], references: [id])

  name      String    // e.g., "2082/2083" (Nepali BS calendar year)
  startDate DateTime
  endDate   DateTime
  isCurrent Boolean   @default(false) // Only ONE per school should be true

  terms       Term[]
  enrollments Enrollment[]
  exams       Exam[]
  feeStructures FeeStructure[]
  invoices    Invoice[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@index([schoolId, deletedAt])
  @@index([schoolId, isCurrent])
}

model Term {
  id             String    @id @default(uuid())
  schoolId       String
  academicYearId String
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])

  name           String    // e.g., "First Term", "Second Term", "Final"
  startDate      DateTime
  endDate        DateTime

  exams          Exam[]

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  @@index([schoolId, deletedAt])
  @@index([schoolId, academicYearId])
}

/// "Grade" represents NEB Class level (11 or 12) + Section (A, B, C...)
model Grade {
  id        String    @id @default(uuid())
  schoolId  String
  school    School    @relation(fields: [schoolId], references: [id])

  level     Int       // 11 or 12
  section   String    // "A", "B", "C", etc.
  stream    Stream    // SCIENCE, MANAGEMENT, HUMANITIES, EDUCATION

  capacity  Int       @default(60) // Max students per section

  enrollments  Enrollment[]
  gradeSubjects GradeSubject[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@unique([schoolId, level, section, stream])
  @@index([schoolId, deletedAt])
}

enum Stream {
  SCIENCE
  MANAGEMENT
  HUMANITIES
  EDUCATION
}

// ==========================================
// 📚 SUBJECTS
// ==========================================

model Subject {
  id          String    @id @default(uuid())
  schoolId    String
  school      School    @relation(fields: [schoolId], references: [id])

  name        String    // e.g., "Physics", "Accountancy", "Nepali"
  code        String    // e.g., "PHY-101"
  creditHours Int       @default(4)

  hasTheory     Boolean @default(true)
  hasPractical  Boolean @default(false)

  theoryFullMarks    Int @default(75)   // NEB standard
  practicalFullMarks Int @default(25)   // NEB standard (if applicable)

  gradeSubjects  GradeSubject[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@unique([schoolId, code])
  @@index([schoolId, deletedAt])
}

/// Junction: Which subjects are assigned to which Grade (class + section)
model GradeSubject {
  id        String    @id @default(uuid())
  schoolId  String
  gradeId   String
  grade     Grade     @relation(fields: [gradeId], references: [id])
  subjectId String
  subject   Subject   @relation(fields: [subjectId], references: [id])

  teacherId String?   // User ID of the assigned teacher

  examResults ExamResult[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@unique([gradeId, subjectId])
  @@index([schoolId, deletedAt])
}

// ==========================================
// 🎓 STUDENTS & ENROLLMENT
// ==========================================

model Student {
  id             String    @id @default(uuid())
  schoolId       String
  school         School    @relation(fields: [schoolId], references: [id])

  registrationNo String    // NEB Registration Number
  symbolNo       String?   // NEB Symbol Number (assigned for exams)
  firstName      String
  lastName       String
  dob            DateTime
  gender         Gender
  phone          String?
  address        String?
  profilePicS3Key String?  // S3 key for student photo
  status         StudentStatus @default(ACTIVE)

  enrollments    Enrollment[]
  examResults    ExamResult[]
  invoices       Invoice[]
  payments       Payment[]
  parents        StudentParent[]

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  @@unique([schoolId, registrationNo])
  @@index([schoolId, deletedAt])
  @@index([schoolId, status])
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum StudentStatus {
  ACTIVE
  GRADUATED
  DROPOUT
  TRANSFERRED
  SUSPENDED
}

/// Links a Student to a Parent/Guardian (User with PARENT role)
model StudentParent {
  id        String    @id @default(uuid())
  schoolId  String
  studentId String
  student   Student   @relation(fields: [studentId], references: [id])
  parentId  String
  parent    User      @relation(fields: [parentId], references: [id])

  relationship String  // "FATHER", "MOTHER", "GUARDIAN"

  createdAt DateTime  @default(now())
  deletedAt DateTime?

  @@unique([studentId, parentId])
  @@index([schoolId, deletedAt])
}

/// Enrollment: A student enrolled in a specific Grade for a specific Academic Year
model Enrollment {
  id             String    @id @default(uuid())
  schoolId       String
  studentId      String
  student        Student   @relation(fields: [studentId], references: [id])
  gradeId        String
  grade          Grade     @relation(fields: [gradeId], references: [id])
  academicYearId String
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])

  enrolledAt     DateTime  @default(now())
  rollNo         Int?      // Class roll number

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  @@unique([schoolId, studentId, academicYearId]) // One enrollment per student per year
  @@index([schoolId, deletedAt])
  @@index([schoolId, gradeId, academicYearId])
}

// ==========================================
// 📝 EXAMS & RESULTS
// ==========================================

model Exam {
  id             String    @id @default(uuid())
  schoolId       String
  school         School    @relation(fields: [schoolId], references: [id])
  academicYearId String
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])
  termId         String?
  term           Term?     @relation(fields: [termId], references: [id])

  name           String    // e.g., "First Terminal Exam", "Final Exam 2082"
  examType       ExamType  // TERMINAL, FINAL, PREBOARD, UNIT_TEST
  startDate      DateTime?
  endDate        DateTime?
  status         ExamStatus @default(DRAFT) // DRAFT → MARKS_ENTRY → FINALIZED → PUBLISHED

  examResults    ExamResult[]

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  @@index([schoolId, deletedAt])
  @@index([schoolId, academicYearId, status])
}

enum ExamType {
  UNIT_TEST
  TERMINAL
  PREBOARD
  FINAL
}

enum ExamStatus {
  DRAFT
  MARKS_ENTRY
  FINALIZED
  PUBLISHED
}

model ExamResult {
  id             String    @id @default(uuid())
  schoolId       String
  examId         String
  exam           Exam      @relation(fields: [examId], references: [id])
  studentId      String
  student        Student   @relation(fields: [studentId], references: [id])
  gradeSubjectId String
  gradeSubject   GradeSubject @relation(fields: [gradeSubjectId], references: [id])

  // Theory marks
  theoryMarksObtained   Decimal?   @db.Decimal(5, 2)
  theoryFullMarks       Int
  theoryPercentage      Decimal?   @db.Decimal(5, 2)
  theoryGrade           String?    // Letter grade (A+, A, B+, etc.)
  theoryGradePoint      Decimal?   @db.Decimal(3, 1)

  // Practical marks (nullable — not all subjects have practicals)
  practicalMarksObtained Decimal?  @db.Decimal(5, 2)
  practicalFullMarks     Int?
  practicalPercentage    Decimal?  @db.Decimal(5, 2)
  practicalGrade         String?
  practicalGradePoint    Decimal?  @db.Decimal(3, 1)

  // Final computed values for this subject
  totalPercentage       Decimal?   @db.Decimal(5, 2)
  finalGrade            String     // Final letter grade for this subject
  finalGradePoint       Decimal?   @db.Decimal(3, 1)
  isNg                  Boolean    @default(false) // Not Graded flag

  remarks               String?

  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt
  deletedAt             DateTime?

  @@unique([examId, studentId, gradeSubjectId]) // One result per student per subject per exam
  @@index([schoolId, deletedAt])
  @@index([schoolId, examId, studentId])
}

// ==========================================
// 💰 FINANCE ENGINE
// ==========================================

model FeeStructure {
  id             String    @id @default(uuid())
  schoolId       String
  school         School    @relation(fields: [schoolId], references: [id])
  academicYearId String
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])

  name           String    // e.g., "Grade 11 Science Annual Fee"
  feeType        FeeType   // TUITION, ADMISSION, EXAM, LAB, LIBRARY, TRANSPORT, OTHER
  amount         Decimal   @db.Decimal(10, 2) // Amount in NPR
  level          Int?      // 11 or 12 (nullable = applies to both)
  stream         Stream?   // Nullable = applies to all streams

  invoiceLineItems InvoiceLineItem[]

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  @@index([schoolId, deletedAt])
  @@index([schoolId, academicYearId])
}

enum FeeType {
  TUITION
  ADMISSION
  EXAM
  LAB
  LIBRARY
  TRANSPORT
  OTHER
}

model Invoice {
  id             String    @id @default(uuid())
  schoolId       String
  school         School    @relation(fields: [schoolId], references: [id])
  studentId      String
  student        Student   @relation(fields: [studentId], references: [id])
  academicYearId String
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])

  invoiceNo      String    // Human-readable invoice number (e.g., "INV-2082-001")
  totalAmount    Decimal   @db.Decimal(10, 2)
  paidAmount     Decimal   @db.Decimal(10, 2) @default(0)
  dueDate        DateTime
  status         InvoiceStatus @default(UNPAID) // UNPAID, PARTIAL, PAID, OVERDUE, CANCELLED

  lineItems      InvoiceLineItem[]
  payments       Payment[]

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  @@unique([schoolId, invoiceNo])
  @@index([schoolId, deletedAt])
  @@index([schoolId, studentId, academicYearId])
  @@index([schoolId, status])
}

enum InvoiceStatus {
  UNPAID
  PARTIAL
  PAID
  OVERDUE
  CANCELLED
}

model InvoiceLineItem {
  id              String    @id @default(uuid())
  schoolId        String
  invoiceId       String
  invoice         Invoice   @relation(fields: [invoiceId], references: [id])
  feeStructureId  String
  feeStructure    FeeStructure @relation(fields: [feeStructureId], references: [id])

  description     String    // e.g., "Tuition Fee - Grade 11 Science"
  amount          Decimal   @db.Decimal(10, 2)
  discount        Decimal   @db.Decimal(10, 2) @default(0) // Scholarship/discount
  netAmount       Decimal   @db.Decimal(10, 2) // amount - discount

  createdAt       DateTime  @default(now())
  deletedAt       DateTime?

  @@index([schoolId, invoiceId])
}

model Payment {
  id              String    @id @default(uuid())
  schoolId        String
  school          School    @relation(fields: [schoolId], references: [id])
  studentId       String
  student         Student   @relation(fields: [studentId], references: [id])
  invoiceId       String?
  invoice         Invoice?  @relation(fields: [invoiceId], references: [id])

  amount          Decimal   @db.Decimal(10, 2)
  paymentMethod   PaymentMethod
  referenceNo     String?   // Bank reference, cheque number, online txn ID
  receiptUrl      String?   // S3 presigned URL for generated receipt
  receiptS3Key    String?   // S3 key for the receipt PDF
  status          PaymentStatus @default(COMPLETED)
  reversalOfId    String?   // If this is a reversal, reference the original Payment ID
  notes           String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  @@index([schoolId, studentId, deletedAt])
  @@index([schoolId, invoiceId])
  @@index([schoolId, status])
}

enum PaymentMethod {
  CASH
  BANK_TRANSFER
  ONLINE
  CHEQUE
}

enum PaymentStatus {
  COMPLETED
  REVERSED
}

// ==========================================
// 🔔 NOTIFICATIONS
// ==========================================

model Notification {
  id        String    @id @default(uuid())
  schoolId  String
  school    School    @relation(fields: [schoolId], references: [id])
  userId    String
  user      User      @relation(fields: [userId], references: [id])

  title     String
  message   String    @db.Text
  type      NotificationType // PAYMENT, EXAM, SYSTEM, JOB_FAILED
  isRead    Boolean   @default(false)

  // Optional reference to the entity this notification is about
  entityName String?  // e.g., "Payment", "ExamResult"
  entityId   String?

  createdAt DateTime  @default(now())
  deletedAt DateTime?

  @@index([schoolId, userId, isRead])
  @@index([schoolId, deletedAt])
}

enum NotificationType {
  PAYMENT
  EXAM
  SYSTEM
  JOB_FAILED
}

// ==========================================
// 🔑 IDEMPOTENCY (Financial Safety)
// ==========================================

model IdempotencyRecord {
  id             String    @id @default(uuid())
  schoolId       String
  idempotencyKey String
  endpoint       String    // e.g., "POST /api/v1/payments"
  responseBody   Json
  statusCode     Int

  createdAt      DateTime  @default(now())
  expiresAt      DateTime  // Auto-expire after 24 hours

  @@unique([schoolId, idempotencyKey, endpoint])
  @@index([expiresAt])
}

// ==========================================
// 🔍 CROSS-CUTTING AUDIT TRAIL
// ==========================================

model AuditLog {
  id           String    @id @default(uuid())
  schoolId     String
  school       School    @relation(fields: [schoolId], references: [id])

  userId       String?
  user         User?     @relation(fields: [userId], references: [id])

  entityName   String    // e.g., "Student", "Payment", "ExamResult"
  entityId     String
  action       String    // CREATE, UPDATE, SOFT_DELETE, REVERSE

  oldValues    Json?
  newValues    Json?
  ipAddress    String?

  createdAt    DateTime  @default(now())

  @@index([schoolId, entityName, entityId])
  @@index([schoolId, createdAt])
}

// ==========================================
// ☁️ FILE ASSETS (S3 References)
// ==========================================

model FileAsset {
  id           String    @id @default(uuid())
  schoolId     String

  fileName     String
  s3Key        String    @unique
  mimeType     String
  sizeBytes    Int

  context      String    // "EXAM_MARKSHEET", "FEE_RECEIPT", "PROFILE_PIC", "SCHOOL_LOGO"
  contextId    String?

  createdAt    DateTime  @default(now())
  deletedAt    DateTime?

  @@index([schoolId, context, contextId])
}
```

---

### 📐 Schema Design Decisions

| Decision                                               | Rationale                                                                                                                                                       |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Grade` has `level` + `section` + `stream`             | NEB schools organize by Grade 11/12, Section A/B/C, and Stream (Science, Management, etc.). A unique constraint ensures no duplicates.                          |
| `GradeSubject` junction table                          | Subjects are assigned per grade-section, not globally. Different sections may have different teacher assignments.                                               |
| `Enrollment` links Student → Grade → AcademicYear      | A student can only be enrolled once per academic year. This tracks class promotions year-over-year.                                                             |
| `ExamResult` references `GradeSubject` not `Subject`   | Results are per-section-subject, tied to the teacher who taught that section.                                                                                   |
| `ExamResult` stores both raw marks and computed grades | Avoids recomputing NEB grades on every query. The `calculateNebGrade()` utility (doc 5) is called once at marks entry time.                                     |
| `Invoice` + `InvoiceLineItem` + `Payment`              | Proper invoicing: an Invoice has line items from FeeStructure. Payments are linked to invoices. This supports partial payments and tracks outstanding balances. |
| `FeeStructure` per academic year                       | Fee amounts can change yearly. Historical fees are preserved via the academic year link.                                                                        |
| `Notification` per user                                | Each notification targets a specific user. WebSocket delivery (doc 6) pushes in real-time; this table provides persistence for offline users.                   |
| `StudentParent` junction                               | One student can have multiple parents/guardians. One parent can have multiple children in the school.                                                           |

---

### 🚨 Rules for the Agent

1. **This schema is authoritative.** When generating any feature, reference these models. Do NOT invent new models or rename existing fields without updating this schema.
2. **Extend, don't break.** If a feature requires a new field, add it to the relevant model here. NEVER remove or rename existing fields that other features depend on.
3. **All enums are Prisma enums.** Do NOT use string literals for fields that have a defined enum (e.g., use `PaymentMethod` not `String`). This ensures database-level validation.
4. **Financial amounts are `Decimal(10, 2)`.** NEVER use `Float` or `Int` for money. The `Decimal` type avoids floating-point rounding errors critical in financial calculations.
5. **NEB Registration Number is unique per school.** The `@@unique([schoolId, registrationNo])` constraint on `Student` prevents duplicate registrations.
6. **Exam status flow is strict:** `DRAFT → MARKS_ENTRY → FINALIZED → PUBLISHED`. Never skip a status. The agent must enforce this state machine in the `ExamsService`.
