import { apiClient } from "./client";
import type {
  ApiResponse,
  PaginatedResponse,
  AsyncJobResponse,
} from "../types/api.types";
import type {
  FeeStructure,
  CreateFeeStructureInput,
  Invoice,
  CreateInvoiceInput,
  BulkInvoiceInput,
  Payment,
  CreatePaymentInput,
} from "../types/finance.types";

export const feeStructuresApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient
      .get<
        PaginatedResponse<FeeStructure>
      >("/finance/fee-structures", { params })
      .then((r) => r.data),

  create: (input: CreateFeeStructureInput) =>
    apiClient
      .post<ApiResponse<FeeStructure>>("/finance/fee-structures", input)
      .then((r) => r.data),

  update: (id: string, input: Partial<CreateFeeStructureInput>) =>
    apiClient
      .patch<ApiResponse<FeeStructure>>(`/finance/fee-structures/${id}`, input)
      .then((r) => r.data),
};

export const invoicesApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<Invoice>>("/finance/invoices", { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<ApiResponse<Invoice>>(`/finance/invoices/${id}`)
      .then((r) => r.data),

  create: (input: CreateInvoiceInput) =>
    apiClient
      .post<ApiResponse<Invoice>>("/finance/invoices", input)
      .then((r) => r.data),

  bulkGenerate: (input: BulkInvoiceInput) =>
    apiClient
      .post<AsyncJobResponse>("/finance/invoices/bulk-generate", input)
      .then((r) => r.data),
};

export const paymentsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<Payment>>("/finance/payments", { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<ApiResponse<Payment>>(`/finance/payments/${id}`)
      .then((r) => r.data),

  create: (input: CreatePaymentInput) =>
    apiClient
      .post<ApiResponse<Payment>>("/finance/payments", input)
      .then((r) => r.data),

  reverse: (id: string, idempotencyKey: string) =>
    apiClient
      .post<
        ApiResponse<Payment>
      >(`/finance/payments/${id}/reverse`, { idempotencyKey })
      .then((r) => r.data),
};
