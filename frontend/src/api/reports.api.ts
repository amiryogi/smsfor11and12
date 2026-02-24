import { apiClient } from "./client";
import type { ApiResponse, AsyncJobResponse } from "../types/api.types";
import type {
  GradeResultSummary,
  FinancialLedgerEntry,
  StudentFinancialStatement,
  OutstandingStudent,
  StudentSummary,
} from "../types/report.types";

export const reportsApi = {
  examGradeReport: (examId: string, gradeId: string) =>
    apiClient
      .get<
        ApiResponse<GradeResultSummary>
      >(`/reports/exam/${examId}/grade/${gradeId}`)
      .then((r) => r.data),

  marksheet: (examId: string, studentId: string) =>
    apiClient
      .get<AsyncJobResponse>(
        `/reports/exam/${examId}/student/${studentId}/marksheet`,
      )
      .then((r) => r.data),

  bulkMarksheets: (examId: string) =>
    apiClient
      .post<AsyncJobResponse>(`/reports/exam/${examId}/bulk-marksheets`)
      .then((r) => r.data),

  financialLedger: (params?: Record<string, unknown>) =>
    apiClient
      .get<
        ApiResponse<FinancialLedgerEntry[]>
      >("/reports/finance/ledger", { params })
      .then((r) => r.data),

  studentFinancial: (studentId: string) =>
    apiClient
      .get<
        ApiResponse<StudentFinancialStatement>
      >(`/reports/finance/student/${studentId}`)
      .then((r) => r.data),

  outstanding: (params?: Record<string, unknown>) =>
    apiClient
      .get<
        ApiResponse<OutstandingStudent[]>
      >("/reports/finance/outstanding", { params })
      .then((r) => r.data),

  studentSummary: () =>
    apiClient
      .get<ApiResponse<StudentSummary>>("/reports/students/summary")
      .then((r) => r.data),
};
