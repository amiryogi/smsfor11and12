import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

const reportsApi = {
  studentSummary: () =>
    apiClient.get("/reports/students/summary").then((r) => r.data),

  financeSummary: () =>
    apiClient.get("/reports/finance/outstanding").then((r) => r.data),

  financeLedger: (params?: Record<string, unknown>) =>
    apiClient.get("/reports/finance/ledger", { params }).then((r) => r.data),

  studentFinance: (studentId: string) =>
    apiClient.get(`/reports/finance/student/${studentId}`).then((r) => r.data),
};

export function useStudentSummary() {
  return useQuery({
    queryKey: ["reports", "students", "summary"],
    queryFn: reportsApi.studentSummary,
    staleTime: 10 * 60 * 1000,
  });
}

export function useFinanceSummary() {
  return useQuery({
    queryKey: ["reports", "finance", "summary"],
    queryFn: reportsApi.financeSummary,
    staleTime: 10 * 60 * 1000,
  });
}
