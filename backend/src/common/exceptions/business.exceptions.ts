import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for all business exceptions.
 * Provides a machine-readable errorCode for frontend consumption.
 */
export class BusinessException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: unknown[],
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
      'STUDENT_NOT_FOUND',
      `Student with ID ${studentId} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class DuplicateRegistrationException extends BusinessException {
  constructor(registrationNo: string) {
    super(
      'DUPLICATE_REGISTRATION',
      `A student with registration number ${registrationNo} already exists`,
      HttpStatus.CONFLICT,
    );
  }
}

export class StudentAlreadyEnrolledException extends BusinessException {
  constructor() {
    super(
      'STUDENT_ALREADY_ENROLLED',
      'Student is already enrolled for this academic year',
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
      'EXAM_NOT_FOUND',
      `Exam with ID ${examId} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class InvalidExamStatusTransition extends BusinessException {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      'INVALID_EXAM_STATUS_TRANSITION',
      `Cannot transition exam from ${currentStatus} to ${targetStatus}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class ExamAlreadyFinalizedException extends BusinessException {
  constructor() {
    super(
      'EXAM_ALREADY_FINALIZED',
      'This exam has already been finalized and cannot be modified',
      HttpStatus.CONFLICT,
    );
  }
}

export class MarksExceedMaximum extends BusinessException {
  constructor(field: string, max: number) {
    super(
      'MARKS_EXCEED_MAXIMUM',
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
      'INVOICE_NOT_FOUND',
      `Invoice with ID ${invoiceId} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class PaymentExceedsBalanceException extends BusinessException {
  constructor(remaining: number) {
    super(
      'PAYMENT_EXCEEDS_BALANCE',
      `Payment amount exceeds outstanding balance of ${remaining}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class PaymentAlreadyReversedException extends BusinessException {
  constructor() {
    super(
      'PAYMENT_ALREADY_REVERSED',
      'This payment has already been reversed',
      HttpStatus.CONFLICT,
    );
  }
}

export class IdempotencyKeyMissingException extends BusinessException {
  constructor() {
    super(
      'IDEMPOTENCY_KEY_MISSING',
      'idempotencyKey is required for financial operations',
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
      'INVALID_CREDENTIALS',
      'Invalid email or password',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AccountDeactivatedException extends BusinessException {
  constructor() {
    super(
      'ACCOUNT_DEACTIVATED',
      'This account has been deactivated. Contact your administrator.',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class TenantAccessDeniedException extends BusinessException {
  constructor() {
    super(
      'TENANT_ACCESS_DENIED',
      'You do not have access to this resource',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class GradeSectionFullException extends BusinessException {
  constructor(level: number, section: string) {
    super(
      'GRADE_SECTION_FULL',
      `Grade ${level} Section ${section} has reached maximum capacity`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

// ==========================================
// GENERIC
// ==========================================

export class ResourceNotFoundException extends BusinessException {
  constructor(resource: string, id: string) {
    super(
      `${resource.toUpperCase()}_NOT_FOUND`,
      `${resource} with ID ${id} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

// ==========================================
// ATTENDANCE DOMAIN
// ==========================================

export class AttendanceAlreadyTakenException extends BusinessException {
  constructor(gradeId: string, date: string) {
    super(
      'ATTENDANCE_ALREADY_TAKEN',
      `Attendance for grade ${gradeId} on ${date} has already been recorded`,
      HttpStatus.CONFLICT,
    );
  }
}

export class AttendanceNotFoundException extends BusinessException {
  constructor(attendanceId: string) {
    super(
      'ATTENDANCE_NOT_FOUND',
      `Attendance record with ID ${attendanceId} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

// ==========================================
// BOARD EXAM REGISTRATION
// ==========================================

export class DuplicateSymbolNoException extends BusinessException {
  constructor(symbolNo: string, academicYearId: string) {
    super(
      'DUPLICATE_SYMBOL_NO',
      `Symbol number ${symbolNo} is already assigned for academic year ${academicYearId}`,
      HttpStatus.CONFLICT,
    );
  }
}

export class BoardExamRegistrationNotFoundException extends BusinessException {
  constructor(id: string) {
    super(
      'BOARD_EXAM_REGISTRATION_NOT_FOUND',
      `Board exam registration with ID ${id} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

// ==========================================
// CONVENIENCE ALIASES (used by service files)
// ==========================================

export const StudentNotFound = StudentNotFoundException;
export const InvoiceNotFound = InvoiceNotFoundException;
export const PaymentExceedsBalance = PaymentExceedsBalanceException;
export const PaymentAlreadyReversed = PaymentAlreadyReversedException;

export class FeeStructureNotFound extends BusinessException {
  constructor(id: string) {
    super(
      'FEE_STRUCTURE_NOT_FOUND',
      `Fee structure with ID ${id} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class PaymentNotFound extends BusinessException {
  constructor(id: string) {
    super(
      'PAYMENT_NOT_FOUND',
      `Payment with ID ${id} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class InvoiceAlreadyCancelled extends BusinessException {
  constructor(id: string) {
    super(
      'INVOICE_ALREADY_CANCELLED',
      `Invoice ${id} is already cancelled`,
      HttpStatus.CONFLICT,
    );
  }
}

// ==========================================
// MARKS LOCKING
// ==========================================

export class MarksEntryNotOpenException extends BusinessException {
  constructor(examId: string, status: string) {
    super(
      'MARKS_ENTRY_NOT_OPEN',
      `Exam ${examId} is in ${status} status — marks can only be entered when status is MARKS_ENTRY`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class SubjectNotAssignedToTeacherException extends BusinessException {
  constructor(gradeSubjectId: string) {
    super(
      'SUBJECT_NOT_ASSIGNED',
      `You are not assigned to teach grade-subject ${gradeSubjectId}. Only your assigned subjects can be edited.`,
      HttpStatus.FORBIDDEN,
    );
  }
}

// ==========================================
// PASSWORD RESET
// ==========================================

export class InvalidResetTokenException extends BusinessException {
  constructor() {
    super(
      'INVALID_RESET_TOKEN',
      'Invalid or expired password reset token',
      HttpStatus.BAD_REQUEST,
    );
  }
}
