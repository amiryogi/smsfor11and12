import { apiClient } from "./client";
import type {
  ApiResponse,
  PaginatedResponse,
  AsyncJobResponse,
} from "../types/api.types";
import type {
  Student,
  CreateStudentInput,
  UpdateStudentInput,
  Enrollment,
  CreateEnrollmentInput,
  BulkPromoteInput,
  StudentParent,
  LinkParentInput,
} from "../types/student.types";

export const studentsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<Student>>("/students", { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Student>>(`/students/${id}`).then((r) => r.data),

  create: (input: CreateStudentInput) =>
    apiClient
      .post<ApiResponse<Student>>("/students", input)
      .then((r) => r.data),

  update: (id: string, input: UpdateStudentInput) =>
    apiClient
      .patch<ApiResponse<Student>>(`/students/${id}`, input)
      .then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/students/${id}`).then((r) => r.data),

  uploadPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("photo", file);
    return apiClient
      .post<ApiResponse<Student>>(`/students/${id}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

export const enrollmentsApi = {
  listByStudent: (studentId: string) =>
    apiClient
      .get<PaginatedResponse<Enrollment>>(`/students/${studentId}/enrollments`)
      .then((r) => r.data),

  list: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<Enrollment>>("/enrollments", { params })
      .then((r) => r.data),

  create: (input: CreateEnrollmentInput) =>
    apiClient
      .post<ApiResponse<Enrollment>>("/enrollments", input)
      .then((r) => r.data),

  bulkPromote: (input: BulkPromoteInput) =>
    apiClient
      .post<AsyncJobResponse>("/enrollments/bulk-promote", input)
      .then((r) => r.data),
};

export const studentParentsApi = {
  list: (studentId: string) =>
    apiClient
      .get<ApiResponse<StudentParent[]>>(`/students/${studentId}/parents`)
      .then((r) => r.data),

  link: (studentId: string, input: LinkParentInput) =>
    apiClient
      .post<ApiResponse<StudentParent>>(`/students/${studentId}/parents`, input)
      .then((r) => r.data),

  unlink: (studentId: string, parentId: string) =>
    apiClient
      .delete(`/students/${studentId}/parents/${parentId}`)
      .then((r) => r.data),
};
