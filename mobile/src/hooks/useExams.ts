import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import type { BulkMarksEntry } from "../types/exam.types";

const examsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get("/exams", { params }).then((r) => r.data),

  getById: (id: string) => apiClient.get(`/exams/${id}`).then((r) => r.data),

  studentResults: (examId: string, studentId?: string) =>
    apiClient
      .get(`/exams/${examId}/results/student/${studentId}`)
      .then((r) => r.data),

  bulkEnterMarks: (examId: string, marks: BulkMarksEntry[]) =>
    apiClient.post(`/exams/${examId}/results/bulk`, marks).then((r) => r.data),
};

export const examKeys = {
  all: ["exams"] as const,
  lists: () => [...examKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...examKeys.lists(), filters] as const,
  details: () => [...examKeys.all, "detail"] as const,
  detail: (id: string) => [...examKeys.details(), id] as const,
  results: (examId: string, studentId: string) =>
    [...examKeys.detail(examId), "results", studentId] as const,
};

export function useExams(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: examKeys.list(filters ?? {}),
    queryFn: () => examsApi.list(filters),
  });
}

export function useExam(examId: string) {
  return useQuery({
    queryKey: examKeys.detail(examId),
    queryFn: () => examsApi.getById(examId),
    enabled: !!examId,
  });
}

export function useStudentExamResults(examId: string, studentId?: string) {
  return useQuery({
    queryKey: examKeys.results(examId, studentId ?? ""),
    queryFn: () => examsApi.studentResults(examId, studentId),
    enabled: !!examId && !!studentId,
  });
}

export function useBulkEnterMarks(examId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (marks: BulkMarksEntry[]) =>
      examsApi.bulkEnterMarks(examId, marks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.detail(examId) });
      queryClient.invalidateQueries({ queryKey: examKeys.lists() });
    },
  });
}
