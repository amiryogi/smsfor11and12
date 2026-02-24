import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feeStructuresApi, invoicesApi, paymentsApi } from "../api/finance.api";
import type {
  CreateFeeStructureInput,
  CreateInvoiceInput,
  BulkInvoiceInput,
  CreatePaymentInput,
} from "../types/finance.types";
import { toast } from "sonner";

// ---- Fee Structures ----
export const feeStructureKeys = {
  all: ["feeStructures"] as const,
  lists: () => [...feeStructureKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...feeStructureKeys.lists(), filters] as const,
};

export function useFeeStructures(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: feeStructureKeys.list(filters ?? {}),
    queryFn: () => feeStructuresApi.list(filters),
  });
}

export function useCreateFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFeeStructureInput) =>
      feeStructuresApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feeStructureKeys.lists() });
      toast.success("Fee structure created");
    },
    onError: () => {
      toast.error("Failed to create fee structure");
    },
  });
}

export function useUpdateFeeStructure(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateFeeStructureInput>) =>
      feeStructuresApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feeStructureKeys.lists() });
      toast.success("Fee structure updated");
    },
    onError: () => {
      toast.error("Failed to update fee structure");
    },
  });
}

// ---- Invoices ----
export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};

export function useInvoices(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: invoiceKeys.list(filters ?? {}),
    queryFn: () => invoicesApi.list(filters),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoicesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => invoicesApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success("Invoice generated");
    },
    onError: () => {
      toast.error("Failed to generate invoice");
    },
  });
}

export function useBulkGenerateInvoices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkInvoiceInput) => invoicesApi.bulkGenerate(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success(data.message || "Bulk generation started");
    },
    onError: () => {
      toast.error("Failed to start bulk generation");
    },
  });
}

// ---- Payments ----
export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, "detail"] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
};

export function usePayments(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: paymentKeys.list(filters ?? {}),
    queryFn: () => paymentsApi.list(filters),
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentInput) => paymentsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.lists() });
      qc.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success("Payment processed");
    },
    onError: () => {
      toast.error("Failed to process payment");
    },
  });
}

export function useReversePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      idempotencyKey,
    }: {
      id: string;
      idempotencyKey: string;
    }) => paymentsApi.reverse(id, idempotencyKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.lists() });
      qc.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success("Payment reversed");
    },
    onError: () => {
      toast.error("Failed to reverse payment");
    },
  });
}
