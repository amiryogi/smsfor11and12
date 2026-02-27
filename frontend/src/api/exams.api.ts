import { apiClient } from "./client";
import type {
  ApiResponse,
  PaginatedResponse,
  AsyncJobResponse,
} from "../types/api.types";
import type {
  Exam,
  CreateExamInput,
  UpdateExamInput,
  ExamResult,
  CreateExamResultInput,
  BulkExamResultInput,
  StudentExamSummary,
  ExamFinalizationResult,
} from "../types/exam.types";

export const examsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<Exam>>("/exams", { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Exam>>(`/exams/${id}`).then((r) => r.data),

  create: (input: CreateExamInput) =>
    apiClient.post<ApiResponse<Exam>>("/exams", input).then((r) => r.data),

  update: (id: string, input: UpdateExamInput) =>
    apiClient
      .patch<ApiResponse<Exam>>(`/exams/${id}`, input)
      .then((r) => r.data),

  openMarksEntry: (id: string) =>
    apiClient
      .post<ApiResponse<Exam>>(`/exams/${id}/open-marks-entry`)
      .then((r) => r.data),

  finalize: (id: string) =>
    apiClient
      .post<ApiResponse<ExamFinalizationResult>>(`/exams/${id}/finalize`)
      .then((r) => r.data),

  publish: (id: string) =>
    apiClient
      .post<ApiResponse<Exam>>(`/exams/${id}/publish`)
      .then((r) => r.data),
};

export const examResultsApi = {
  list: (examId: string, params?: Record<string, unknown>) =>
    apiClient
      .get<
        PaginatedResponse<ExamResult>
      >(`/exams/${examId}/results`, { params })
      .then((r) => r.data),

  create: (examId: string, input: CreateExamResultInput) =>
    apiClient
      .post<ApiResponse<ExamResult>>(`/exams/${examId}/results`, input)
      .then((r) => r.data),

  bulkCreate: (examId: string, input: BulkExamResultInput) =>
    apiClient
      .post<ApiResponse<ExamResult[]>>(`/exams/${examId}/results/bulk`, input)
      .then((r) => r.data),

  getByStudent: (examId: string, studentId: string) =>
    apiClient
      .get<
        ApiResponse<ExamResult[]>
      >(`/exams/${examId}/results/student/${studentId}`)
      .then((r) => r.data),
};

export const examSummariesApi = {
  list: (examId: string) =>
    apiClient
      .get<
        ApiResponse<StudentExamSummary[]>
      >(`/exams/${examId}/summaries`)
      .then((r) => r.data),

  getByStudent: (examId: string, studentId: string) =>
    apiClient
      .get<
        ApiResponse<StudentExamSummary>
      >(`/exams/${examId}/summaries/student/${studentId}`)
      .then((r) => r.data),
};
