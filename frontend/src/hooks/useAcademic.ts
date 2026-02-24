import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  academicYearsApi,
  termsApi,
  gradesApi,
  subjectsApi,
  gradeSubjectsApi,
} from "../api/academic.api";
import type {
  CreateAcademicYearInput,
  CreateTermInput,
  CreateGradeInput,
  CreateSubjectInput,
  AssignSubjectInput,
} from "../types/academic.types";
import { toast } from "sonner";

// ---- Academic Years ----
export const academicYearKeys = {
  all: ["academicYears"] as const,
  lists: () => [...academicYearKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...academicYearKeys.lists(), filters] as const,
};

export function useAcademicYears(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: academicYearKeys.list(filters ?? {}),
    queryFn: () => academicYearsApi.list(filters),
  });
}

export function useCreateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAcademicYearInput) =>
      academicYearsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academicYearKeys.lists() });
      toast.success("Academic year created");
    },
    onError: () => {
      toast.error("Failed to create academic year");
    },
  });
}

export function useUpdateAcademicYear(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateAcademicYearInput>) =>
      academicYearsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academicYearKeys.lists() });
      toast.success("Academic year updated");
    },
    onError: () => {
      toast.error("Failed to update academic year");
    },
  });
}

// ---- Terms ----
export const termKeys = {
  all: ["terms"] as const,
  lists: (yearId: string) => [...termKeys.all, "list", yearId] as const,
};

export function useTerms(yearId: string) {
  return useQuery({
    queryKey: termKeys.lists(yearId),
    queryFn: () => termsApi.list(yearId),
    enabled: !!yearId,
  });
}

export function useCreateTerm(yearId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTermInput) => termsApi.create(yearId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: termKeys.lists(yearId) });
      toast.success("Term created");
    },
    onError: () => {
      toast.error("Failed to create term");
    },
  });
}

export function useUpdateTerm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateTermInput>;
    }) => termsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: termKeys.all });
      toast.success("Term updated");
    },
    onError: () => {
      toast.error("Failed to update term");
    },
  });
}

// ---- Grades ----
export const gradeKeys = {
  all: ["grades"] as const,
  lists: () => [...gradeKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...gradeKeys.lists(), filters] as const,
};

export function useGrades(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: gradeKeys.list(filters ?? {}),
    queryFn: () => gradesApi.list(filters),
  });
}

export function useCreateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGradeInput) => gradesApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gradeKeys.lists() });
      toast.success("Grade created");
    },
    onError: () => {
      toast.error("Failed to create grade");
    },
  });
}

export function useUpdateGrade(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateGradeInput>) =>
      gradesApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gradeKeys.lists() });
      toast.success("Grade updated");
    },
    onError: () => {
      toast.error("Failed to update grade");
    },
  });
}

export function useDeleteGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gradesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gradeKeys.lists() });
      toast.success("Grade deleted");
    },
    onError: () => {
      toast.error("Failed to delete grade");
    },
  });
}

// ---- Subjects ----
export const subjectKeys = {
  all: ["subjects"] as const,
  lists: () => [...subjectKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...subjectKeys.lists(), filters] as const,
};

export function useSubjects(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: subjectKeys.list(filters ?? {}),
    queryFn: () => subjectsApi.list(filters),
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubjectInput) => subjectsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subjectKeys.lists() });
      toast.success("Subject created");
    },
    onError: () => {
      toast.error("Failed to create subject");
    },
  });
}

export function useUpdateSubject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateSubjectInput>) =>
      subjectsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subjectKeys.lists() });
      toast.success("Subject updated");
    },
    onError: () => {
      toast.error("Failed to update subject");
    },
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subjectsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subjectKeys.lists() });
      toast.success("Subject deleted");
    },
    onError: () => {
      toast.error("Failed to delete subject");
    },
  });
}

// ---- Grade Subjects ----
export const gradeSubjectKeys = {
  all: ["gradeSubjects"] as const,
  lists: (gradeId: string) =>
    [...gradeSubjectKeys.all, "list", gradeId] as const,
};

export function useGradeSubjects(gradeId: string) {
  return useQuery({
    queryKey: gradeSubjectKeys.lists(gradeId),
    queryFn: () => gradeSubjectsApi.list(gradeId),
    enabled: !!gradeId,
  });
}

export function useAssignSubject(gradeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignSubjectInput) =>
      gradeSubjectsApi.assign(gradeId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gradeSubjectKeys.lists(gradeId) });
      toast.success("Subject assigned");
    },
    onError: () => {
      toast.error("Failed to assign subject");
    },
  });
}

export function useRemoveGradeSubject(gradeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gradeSubjectsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gradeSubjectKeys.lists(gradeId) });
      toast.success("Subject removed from grade");
    },
    onError: () => {
      toast.error("Failed to remove subject");
    },
  });
}
