import { useQuery, useMutation } from "@tanstack/react-query";
import { reportsApi } from "../api/reports.api";
import { toast } from "sonner";

export const reportKeys = {
  all: ["reports"] as const,
  examGrade: (examId: string, gradeId: string) =>
    [...reportKeys.all, "examGrade", examId, gradeId] as const,
  financialLedger: (filters: Record<string, unknown>) =>
    [...reportKeys.all, "ledger", filters] as const,
  studentFinancial: (studentId: string) =>
    [...reportKeys.all, "studentFinancial", studentId] as const,
  outstanding: (filters: Record<string, unknown>) =>
    [...reportKeys.all, "outstanding", filters] as const,
  studentSummary: () => [...reportKeys.all, "studentSummary"] as const,
};

export function useExamGradeReport(examId: string, gradeId: string) {
  return useQuery({
    queryKey: reportKeys.examGrade(examId, gradeId),
    queryFn: () => reportsApi.examGradeReport(examId, gradeId),
    enabled: !!examId && !!gradeId,
  });
}

export function useRequestMarksheet() {
  return useMutation({
    mutationFn: ({
      examId,
      studentId,
    }: {
      examId: string;
      studentId: string;
    }) => reportsApi.marksheet(examId, studentId),
    onSuccess: (data) => {
      toast.success(data.message || "Marksheet generation started");
    },
    onError: () => {
      toast.error("Failed to request marksheet");
    },
  });
}

export function useBulkMarksheets() {
  return useMutation({
    mutationFn: (examId: string) => reportsApi.bulkMarksheets(examId),
    onSuccess: (data) => {
      toast.success(data.message || "Bulk marksheet generation started");
    },
    onError: () => {
      toast.error("Failed to start bulk marksheet generation");
    },
  });
}

export function useFinancialLedger(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: reportKeys.financialLedger(filters ?? {}),
    queryFn: () => reportsApi.financialLedger(filters),
  });
}

export function useStudentFinancialReport(studentId: string) {
  return useQuery({
    queryKey: reportKeys.studentFinancial(studentId),
    queryFn: () => reportsApi.studentFinancial(studentId),
    enabled: !!studentId,
  });
}

export function useOutstandingReport(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: reportKeys.outstanding(filters ?? {}),
    queryFn: () => reportsApi.outstanding(filters),
  });
}

export function useStudentSummaryReport() {
  return useQuery({
    queryKey: reportKeys.studentSummary(),
    queryFn: () => reportsApi.studentSummary(),
  });
}
