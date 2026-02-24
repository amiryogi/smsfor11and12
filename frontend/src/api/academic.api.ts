import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse } from "../types/api.types";
import type {
  AcademicYear,
  CreateAcademicYearInput,
  Term,
  CreateTermInput,
  Grade,
  CreateGradeInput,
  Subject,
  CreateSubjectInput,
  GradeSubject,
  AssignSubjectInput,
} from "../types/academic.types";

export const academicYearsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<AcademicYear>>("/academic/years", { params })
      .then((r) => r.data),

  create: (input: CreateAcademicYearInput) =>
    apiClient
      .post<ApiResponse<AcademicYear>>("/academic/years", input)
      .then((r) => r.data),

  update: (id: string, input: Partial<CreateAcademicYearInput>) =>
    apiClient
      .patch<ApiResponse<AcademicYear>>(`/academic/years/${id}`, input)
      .then((r) => r.data),
};

export const termsApi = {
  list: (yearId: string) =>
    apiClient
      .get<PaginatedResponse<Term>>(`/academic/years/${yearId}/terms`)
      .then((r) => r.data),

  create: (yearId: string, input: CreateTermInput) =>
    apiClient
      .post<ApiResponse<Term>>(`/academic/years/${yearId}/terms`, input)
      .then((r) => r.data),

  update: (id: string, input: Partial<CreateTermInput>) =>
    apiClient
      .patch<ApiResponse<Term>>(`/academic/terms/${id}`, input)
      .then((r) => r.data),
};

export const gradesApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<Grade>>("/academic/grades", { params })
      .then((r) => r.data),

  create: (input: CreateGradeInput) =>
    apiClient
      .post<ApiResponse<Grade>>("/academic/grades", input)
      .then((r) => r.data),

  update: (id: string, input: Partial<CreateGradeInput>) =>
    apiClient
      .patch<ApiResponse<Grade>>(`/academic/grades/${id}`, input)
      .then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/academic/grades/${id}`).then((r) => r.data),
};

export const subjectsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<Subject>>("/academic/subjects", { params })
      .then((r) => r.data),

  create: (input: CreateSubjectInput) =>
    apiClient
      .post<ApiResponse<Subject>>("/academic/subjects", input)
      .then((r) => r.data),

  update: (id: string, input: Partial<CreateSubjectInput>) =>
    apiClient
      .patch<ApiResponse<Subject>>(`/academic/subjects/${id}`, input)
      .then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/academic/subjects/${id}`).then((r) => r.data),
};

export const gradeSubjectsApi = {
  list: (gradeId: string) =>
    apiClient
      .get<
        PaginatedResponse<GradeSubject>
      >(`/academic/grades/${gradeId}/subjects`)
      .then((r) => r.data),

  assign: (gradeId: string, input: AssignSubjectInput) =>
    apiClient
      .post<
        ApiResponse<GradeSubject>
      >(`/academic/grades/${gradeId}/subjects`, input)
      .then((r) => r.data),

  update: (id: string, input: Partial<AssignSubjectInput>) =>
    apiClient
      .patch<ApiResponse<GradeSubject>>(`/academic/grade-subjects/${id}`, input)
      .then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/academic/grade-subjects/${id}`).then((r) => r.data),
};
