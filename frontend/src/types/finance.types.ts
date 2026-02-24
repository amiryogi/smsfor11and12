import type {
  FeeType,
  Stream,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from "./api.types";

export interface FeeStructure {
  id: string;
  schoolId: string;
  academicYearId: string;
  name: string;
  feeType: FeeType;
  amount: number;
  level: number | null;
  stream: Stream | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeeStructureInput {
  name: string;
  feeType: FeeType;
  amount: number;
  academicYearId: string;
  level?: number;
  stream?: Stream;
}

export interface Invoice {
  id: string;
  schoolId: string;
  studentId: string;
  academicYearId: string;
  invoiceNo: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  lineItems?: InvoiceLineItem[];
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    registrationNo: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  feeStructureId: string;
  description: string;
  amount: number;
  discount: number;
  netAmount: number;
}

export interface CreateInvoiceInput {
  studentId: string;
  academicYearId: string;
  dueDate: string;
}

export interface BulkInvoiceInput {
  gradeId: string;
  academicYearId: string;
  dueDate: string;
}

export interface Payment {
  id: string;
  schoolId: string;
  studentId: string;
  invoiceId: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNo: string | null;
  receiptUrl: string | null;
  receiptS3Key: string | null;
  status: PaymentStatus;
  reversalOfId: string | null;
  notes: string | null;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    registrationNo: string;
  };
  invoice?: { id: string; invoiceNo: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentInput {
  studentId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNo?: string;
  notes?: string;
  idempotencyKey: string;
}
