import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  studentsApi,
  enrollmentsApi,
  studentParentsApi,
} from "../api/students.api";
import type {
  CreateStudentInput,
  UpdateStudentInput,
  CreateEnrollmentInput,
  BulkPromoteInput,
  LinkParentInput,
} from "../types/student.types";
import { toast } from "sonner";

export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, "detail"] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};

export function useStudents(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: studentKeys.list(filters ?? {}),
    queryFn: () => studentsApi.list(filters),
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStudentInput) => studentsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.lists() });
      toast.success("Student registered");
    },
    onError: () => {
      toast.error("Failed to register student");
    },
  });
}

export function useUpdateStudent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateStudentInput) => studentsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.detail(id) });
      qc.invalidateQueries({ queryKey: studentKeys.lists() });
      toast.success("Student updated");
    },
    onError: () => {
      toast.error("Failed to update student");
    },
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.lists() });
      toast.success("Student removed");
    },
    onError: () => {
      toast.error("Failed to remove student");
    },
  });
}

export function useUploadStudentPhoto(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => studentsApi.uploadPhoto(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.detail(id) });
      toast.success("Photo uploaded");
    },
    onError: () => {
      toast.error("Failed to upload photo");
    },
  });
}

// ---- Enrollments ----
export const enrollmentKeys = {
  all: ["enrollments"] as const,
  lists: () => [...enrollmentKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...enrollmentKeys.lists(), filters] as const,
  byStudent: (studentId: string) =>
    [...enrollmentKeys.all, "student", studentId] as const,
};

export function useEnrollments(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: enrollmentKeys.list(filters ?? {}),
    queryFn: () => enrollmentsApi.list(filters),
  });
}

export function useStudentEnrollments(studentId: string) {
  return useQuery({
    queryKey: enrollmentKeys.byStudent(studentId),
    queryFn: () => enrollmentsApi.listByStudent(studentId),
    enabled: !!studentId,
  });
}

export function useCreateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEnrollmentInput) => enrollmentsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.lists() });
      qc.invalidateQueries({ queryKey: studentKeys.all });
      toast.success("Student enrolled");
    },
    onError: () => {
      toast.error("Failed to enroll student");
    },
  });
}

export function useBulkPromote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkPromoteInput) => enrollmentsApi.bulkPromote(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.lists() });
      toast.success(data.message || "Promotion started");
    },
    onError: () => {
      toast.error("Failed to start promotion");
    },
  });
}

// ---- Parents ----
export const parentKeys = {
  all: ["studentParents"] as const,
  byStudent: (studentId: string) => [...parentKeys.all, studentId] as const,
};

export function useStudentParents(studentId: string) {
  return useQuery({
    queryKey: parentKeys.byStudent(studentId),
    queryFn: () => studentParentsApi.list(studentId),
    enabled: !!studentId,
  });
}

export function useLinkParent(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LinkParentInput) =>
      studentParentsApi.link(studentId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: parentKeys.byStudent(studentId) });
      toast.success("Parent linked");
    },
    onError: () => {
      toast.error("Failed to link parent");
    },
  });
}

export function useUnlinkParent(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (parentId: string) =>
      studentParentsApi.unlink(studentId, parentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: parentKeys.byStudent(studentId) });
      toast.success("Parent unlinked");
    },
    onError: () => {
      toast.error("Failed to unlink parent");
    },
  });
}
