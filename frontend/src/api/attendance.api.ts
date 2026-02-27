import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse } from "../types/api.types";
import type {
  Attendance,
  TakeAttendanceInput,
  UpdateAttendanceInput,
  AttendanceSummary,
  BoardExamRegistration,
  CreateBoardExamRegistrationInput,
  UpdateBoardExamRegistrationInput,
} from "../types/attendance.types";

export const attendanceApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<Attendance>>("/attendance", { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<ApiResponse<Attendance>>(`/attendance/${id}`)
      .then((r) => r.data),

  take: (input: TakeAttendanceInput) =>
    apiClient
      .post<ApiResponse<Attendance>>("/attendance", input)
      .then((r) => r.data),

  update: (id: string, input: UpdateAttendanceInput) =>
    apiClient
      .patch<ApiResponse<Attendance>>(`/attendance/${id}`, input)
      .then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/attendance/${id}`).then((r) => r.data),

  getStudentSummary: (studentId: string, academicYearId?: string) =>
    apiClient
      .get<ApiResponse<AttendanceSummary>>(
        `/attendance/student/${studentId}/summary`,
        { params: academicYearId ? { academicYearId } : undefined },
      )
      .then((r) => r.data),
};

export const boardExamApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<BoardExamRegistration>>(
        "/board-exam-registrations",
        { params },
      )
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<ApiResponse<BoardExamRegistration>>(
        `/board-exam-registrations/${id}`,
      )
      .then((r) => r.data),

  create: (input: CreateBoardExamRegistrationInput) =>
    apiClient
      .post<ApiResponse<BoardExamRegistration>>(
        "/board-exam-registrations",
        input,
      )
      .then((r) => r.data),

  update: (id: string, input: UpdateBoardExamRegistrationInput) =>
    apiClient
      .patch<ApiResponse<BoardExamRegistration>>(
        `/board-exam-registrations/${id}`,
        input,
      )
      .then((r) => r.data),

  remove: (id: string) =>
    apiClient
      .delete(`/board-exam-registrations/${id}`)
      .then((r) => r.data),
};
