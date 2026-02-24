// Shared API types

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "TEACHER"
  | "ACCOUNTANT"
  | "PARENT"
  | "STUDENT";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type Stream = "SCIENCE" | "MANAGEMENT" | "HUMANITIES" | "EDUCATION";
export type StudentStatus =
  | "ACTIVE"
  | "GRADUATED"
  | "DROPOUT"
  | "TRANSFERRED"
  | "SUSPENDED";
export type ExamType = "UNIT_TEST" | "TERMINAL" | "PREBOARD" | "FINAL";
export type ExamStatus = "DRAFT" | "MARKS_ENTRY" | "FINALIZED" | "PUBLISHED";
export type FeeType =
  | "TUITION"
  | "ADMISSION"
  | "EXAM"
  | "LAB"
  | "LIBRARY"
  | "TRANSPORT"
  | "OTHER";
export type InvoiceStatus =
  | "UNPAID"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "ONLINE" | "CHEQUE";
export type PaymentStatus = "COMPLETED" | "REVERSED";
export type NotificationType = "PAYMENT" | "EXAM" | "SYSTEM" | "JOB_FAILED";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface AsyncJobResponse {
  success: boolean;
  data: { jobId: string };
  message: string;
}
