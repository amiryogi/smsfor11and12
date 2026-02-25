import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import type { CreatePaymentRequest } from "../types/finance.types";

const financeApi = {
  invoices: (params?: Record<string, unknown>) =>
    apiClient.get("/finance/invoices", { params }).then((r) => r.data),

  invoiceById: (id: string) =>
    apiClient.get(`/finance/invoices/${id}`).then((r) => r.data),

  payments: (params?: Record<string, unknown>) =>
    apiClient.get("/finance/payments", { params }).then((r) => r.data),

  paymentById: (id: string) =>
    apiClient.get(`/finance/payments/${id}`).then((r) => r.data),

  createPayment: (body: CreatePaymentRequest) =>
    apiClient.post("/finance/payments", body).then((r) => r.data),
};

export const financeKeys = {
  invoices: {
    all: ["invoices"] as const,
    lists: () => [...financeKeys.invoices.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...financeKeys.invoices.lists(), filters] as const,
    detail: (id: string) =>
      [...financeKeys.invoices.all, "detail", id] as const,
  },
  payments: {
    all: ["payments"] as const,
    lists: () => [...financeKeys.payments.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...financeKeys.payments.lists(), filters] as const,
    detail: (id: string) =>
      [...financeKeys.payments.all, "detail", id] as const,
  },
};

export function useInvoices(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: financeKeys.invoices.list(filters ?? {}),
    queryFn: () => financeApi.invoices(filters),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: financeKeys.invoices.detail(id),
    queryFn: () => financeApi.invoiceById(id),
    enabled: !!id,
  });
}

export function usePayments(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: financeKeys.payments.list(filters ?? {}),
    queryFn: () => financeApi.payments(filters),
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: financeKeys.payments.detail(id),
    queryFn: () => financeApi.paymentById(id),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: financeApi.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices.lists() });
      queryClient.invalidateQueries({ queryKey: financeKeys.payments.lists() });
    },
  });
}
