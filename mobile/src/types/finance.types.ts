export interface Invoice {
  id: string;
  invoiceNo?: string;
  studentId: string;
  studentName: string;
  academicYearName: string;
  status: "DRAFT" | "UNPAID" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  balanceDue: number;
  issueDate?: string;
  dueDate?: string;
  lineItems?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  feeType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  invoiceId: string;
  invoiceNo?: string;
  amount: number;
  method?: string;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CHEQUE" | "ONLINE";
  referenceNo?: string;
  receiptNo?: string;
  receiptS3Key?: string;
  paidAt?: string;
  remarks?: string;
  createdAt: string;
}

export interface CreatePaymentRequest {
  invoiceId: string;
  amount: number;
  paymentMethod: Payment["paymentMethod"];
  referenceNo?: string;
}
