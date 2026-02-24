import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examsApi, examResultsApi } from "../api/exams.api";
import type {
  CreateExamInput,
  UpdateExamInput,
  CreateExamResultInput,
  BulkExamResultInput,
} from "../types/exam.types";
import { toast } from "sonner";

export const examKeys = {
  all: ["exams"] as const,
  lists: () => [...examKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...examKeys.lists(), filters] as const,
  details: () => [...examKeys.all, "detail"] as const,
  detail: (id: string) => [...examKeys.details(), id] as const,
};

export function useExams(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: examKeys.list(filters ?? {}),
    queryFn: () => examsApi.list(filters),
  });
}

export function useExam(id: string) {
  return useQuery({
    queryKey: examKeys.detail(id),
    queryFn: () => examsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExamInput) => examsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: examKeys.lists() });
      toast.success("Exam created");
    },
    onError: () => {
      toast.error("Failed to create exam");
    },
  });
}

export function useUpdateExam(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateExamInput) => examsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: examKeys.detail(id) });
      qc.invalidateQueries({ queryKey: examKeys.lists() });
      toast.success("Exam updated");
    },
    onError: () => {
      toast.error("Failed to update exam");
    },
  });
}

export function useOpenMarksEntry(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => examsApi.openMarksEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: examKeys.detail(id) });
      qc.invalidateQueries({ queryKey: examKeys.lists() });
      toast.success("Marks entry opened");
    },
    onError: () => {
      toast.error("Failed to open marks entry");
    },
  });
}

export function useFinalizeExam(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => examsApi.finalize(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: examKeys.detail(id) });
      qc.invalidateQueries({ queryKey: examKeys.lists() });
      toast.success(data.message || "Finalization started");
    },
    onError: () => {
      toast.error("Failed to finalize exam");
    },
  });
}

export function usePublishExam(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => examsApi.publish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: examKeys.detail(id) });
      qc.invalidateQueries({ queryKey: examKeys.lists() });
      toast.success("Exam published");
    },
    onError: () => {
      toast.error("Failed to publish exam");
    },
  });
}

// ---- Exam Results ----
export const examResultKeys = {
  all: ["examResults"] as const,
  lists: (examId: string) => [...examResultKeys.all, "list", examId] as const,
  list: (examId: string, filters: Record<string, unknown>) =>
    [...examResultKeys.lists(examId), filters] as const,
  byStudent: (examId: string, studentId: string) =>
    [...examResultKeys.all, "student", examId, studentId] as const,
};

export function useExamResults(
  examId: string,
  filters?: Record<string, unknown>,
) {
  return useQuery({
    queryKey: examResultKeys.list(examId, filters ?? {}),
    queryFn: () => examResultsApi.list(examId, filters),
    enabled: !!examId,
  });
}

export function useStudentExamResults(examId: string, studentId: string) {
  return useQuery({
    queryKey: examResultKeys.byStudent(examId, studentId),
    queryFn: () => examResultsApi.getByStudent(examId, studentId),
    enabled: !!examId && !!studentId,
  });
}

export function useCreateExamResult(examId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExamResultInput) =>
      examResultsApi.create(examId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: examResultKeys.lists(examId) });
      toast.success("Marks saved");
    },
    onError: () => {
      toast.error("Failed to save marks");
    },
  });
}

export function useBulkCreateExamResults(examId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkExamResultInput) =>
      examResultsApi.bulkCreate(examId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: examResultKeys.lists(examId) });
      toast.success("Bulk marks saved");
    },
    onError: () => {
      toast.error("Failed to save bulk marks");
    },
  });
}
