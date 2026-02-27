This plan is ordered by NEB/Nepal urgency, building on the strong existing foundation.

Phase 1: Schema Alignment & Nepal Correctness (Critical)
Add BS date fields to Student — dobBsYear Int, dobBsMDay Int, dobBsDay Int alongside the existing AD dob. Add a Nepal date conversion utility (AD↔BS) using a lookup table or the nepali-date-converter npm package
Create BoardExamRegistration model — studentId, academicYearId, symbolNo, schoolId with unique constraint on [schoolId, symbolNo, academicYearId]. Move symbolNo off the Student model
Add gradeId to Exam — scope exams to specific grades so "Class 11 Terminal" and "Class 12 Terminal" are structurally distinct
Create StudentSubjectSelection model — studentId, gradeSubjectId, academicYearId to allow per-student elective subject choice
Add Nepal payment methods to PaymentMethod enum — add ESEWA, KHALTI alongside existing values
Run migration, update seed with BS dates and board exam registration for demo data
Phase 2: NEB Grading Completeness (Critical)
Implement credit-hour-weighted GPA in neb-grading.util.ts — accept {gradePoint, creditHours}[], compute 
CGPA
=
∑
(
G
P
i
×
C
H
i
)
∑
C
H
i
CGPA= 
∑CH 
i
​
 
∑(GP 
i
​
 ×CH 
i
​
 )
​
 
Add exam weightage model — ExamWeightage with examType, gradeId, academicYearId, weightPercent (e.g., Internal 25%, Terminal 75%)
Add cumulative result computation — service that combines weighted results across exam types into a final transcript grade
Add internal assessment model — InternalAssessment table for project/participation/attendance marks (NEB mandates 25% internal for most subjects)
Add attendance — Attendance + AttendanceRecord models, daily bulk entry endpoint, monthly summary query
Phase 3: Storage & Security Fixes (High)
Decide: Cloudinary vs MinIO — either remove MinIO from docker-compose and keep Cloudinary, OR switch StorageService to @aws-sdk/client-s3 pointing at MinIO per the spec. Recommend MinIO for self-hosted schools (no cloud dependency)
Server-side refresh tokens — add RefreshToken model (per SQL schema), implement token rotation with server-side revocation list. On user deactivation → revoke all tokens
Switch web auth to httpOnly cookies or at minimum move to in-memory-only token storage with refresh-on-reload via /auth/me
Implement DLQ admin endpoints — GET /admin/failed-jobs, POST /admin/failed-jobs/:jobId/retry per doc 4
Phase 4: Backend Feature Completion (High)
Attendance module — AttendanceController with bulk daily entry (teacher marks 40 students at once), monthly summary, absence count per student
Marks locking — per-subject lock so teachers can only enter/edit marks for their assigned subjects during MARKS_ENTRY status
Bulk marks import — CSV upload endpoint that parses and upserts marks into ExamResult
Forgot password — endpoint + email OTP or reset link (BullMQ job for email sending)
NEB certificate generation — marksheet, character certificate, transfer certificate templates with BS dates and Nepali number formatting
Idempotency cleanup job — scheduled BullMQ recurring job to purge expired IdempotencyRecord rows every 6 hours (per doc 3)
Phase 5: Frontend & Mobile Completion (Medium)
BS date picker component — dual-calendar component showing both AD and BS dates; all student forms and reports display BS dates
Attendance pages — daily entry grid (web), teacher attendance screen (mobile)
Student subject selection UI — for optional/elective subjects during enrollment
Board exam registration page — assign symbol numbers per academic year
Page-level role guards on web — redirect unauthorized users accessing routes they shouldn't
Forgot password flow on web (currently only mobile has the screen)
DLQ admin dashboard — failed jobs list with retry capability
Dark mode — implement Tailwind dark mode on web, wire up NativeWind dark on mobile
Offline caching on mobile — cache student lists, exam results in MMKV for read-only offline access
Phase 6: Testing & Production Readiness (Pre-Launch)
Unit tests — NEB grading (boundary values, credit-hour weighting), payment ACID, idempotency, enrollment capacity — per doc 12 test factories
E2E tests — auth flow, student CRUD, marks entry → publish cycle, payment → reversal cycle
Frontend tests — critical form validation (marks entry, payment creation)
Rate limiting — extend beyond auth to finance and report endpoints
Database indexes — audit slow queries against current composite indexes; add coverage for report aggregations
Monitoring — wire pino structured logs to a log aggregator; add BullMQ queue metrics to health endpoint
Data migration scripts — import tools for schools migrating from paper/Excel records
Verification: After each phase, run prisma migrate dev, execute the existing seed, hit all API endpoints via Swagger at /api/docs, and run the test suite. The marksheet PDF pipeline (create exam → enter marks → finalize → publish → generate PDF) is the end-to-end smoke test that touches the most modules.

Summary
The project has a production-grade architecture — the modular monolith, multi-tenancy, financial safety, and async job patterns are all well-executed. But it was built from the .github spec which is Nepal-generic, not NEB-specific. The SQL schema captures important Nepal realities (BS dates, eSewa/Khalti, board exam registration, per-mark locking) that the implementation skipped.

The three highest-impact fixes for NEB compliance:

Credit-hour-weighted CGPA — the current unweighted grading is mathematically incorrect for NEB
Board exam registration with per-year symbol numbers — NEB requires this for every student appearing in board exams
BS (Bikram Sambat) date support — every official document in Nepal uses BS dates; displaying only AD dates makes the system unusable for official purposes
The SQL schema should be reconciled with the Prisma schema — keep one source of truth, retire the other, and cherry-pick the Nepal-specific features the SQL got right.