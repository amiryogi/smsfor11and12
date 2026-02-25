import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

const studentsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get("/students", { params }).then((r) => r.data),

  getById: (id: string) => apiClient.get(`/students/${id}`).then((r) => r.data),

  enrollments: (studentId: string) =>
    apiClient.get(`/students/${studentId}/enrollments`).then((r) => r.data),
};

export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, "detail"] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
  enrollments: (id: string) =>
    [...studentKeys.detail(id), "enrollments"] as const,
};

export function useStudents(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: studentKeys.list(filters ?? {}),
    queryFn: () => studentsApi.list(filters),
  });
}

export function useInfiniteStudents(filters: { search?: string }) {
  return useInfiniteQuery({
    queryKey: ["students", "infinite", filters],
    queryFn: ({ pageParam = 1 }) =>
      studentsApi.list({ ...filters, page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage: Record<string, unknown>) => {
      const meta = lastPage.meta as
        | { page: number; totalPages: number }
        | undefined;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
  });
}

export function useStudentEnrollments(studentId: string) {
  return useQuery({
    queryKey: studentKeys.enrollments(studentId),
    queryFn: () => studentsApi.enrollments(studentId),
    enabled: !!studentId,
  });
}
