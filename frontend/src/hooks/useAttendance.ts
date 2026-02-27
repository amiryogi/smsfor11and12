import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi, boardExamApi } from "../api/attendance.api";
import type {
  TakeAttendanceInput,
  UpdateAttendanceInput,
  CreateBoardExamRegistrationInput,
  UpdateBoardExamRegistrationInput,
} from "../types/attendance.types";
import { toast } from "sonner";

// ====================== ATTENDANCE ======================

export const attendanceKeys = {
  all: ["attendance"] as const,
  lists: () => [...attendanceKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...attendanceKeys.lists(), filters] as const,
  details: () => [...attendanceKeys.all, "detail"] as const,
  detail: (id: string) => [...attendanceKeys.details(), id] as const,
  studentSummary: (studentId: string, academicYearId?: string) =>
    [...attendanceKeys.all, "student-summary", studentId, academicYearId] as const,
};

export function useAttendanceList(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: attendanceKeys.list(filters ?? {}),
    queryFn: () => attendanceApi.list(filters),
  });
}

export function useAttendanceDetail(id: string) {
  return useQuery({
    queryKey: attendanceKeys.detail(id),
    queryFn: () => attendanceApi.getById(id),
    enabled: !!id,
  });
}

export function useStudentAttendanceSummary(
  studentId: string,
  academicYearId?: string,
) {
  return useQuery({
    queryKey: attendanceKeys.studentSummary(studentId, academicYearId),
    queryFn: () => attendanceApi.getStudentSummary(studentId, academicYearId),
    enabled: !!studentId,
  });
}

export function useTakeAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TakeAttendanceInput) => attendanceApi.take(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceKeys.lists() });
      toast.success("Attendance recorded successfully");
    },
    onError: () => toast.error("Failed to record attendance"),
  });
}

export function useUpdateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAttendanceInput }) =>
      attendanceApi.update(id, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: attendanceKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: attendanceKeys.lists() });
      toast.success("Attendance updated");
    },
    onError: () => toast.error("Failed to update attendance"),
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attendanceApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceKeys.lists() });
      toast.success("Attendance deleted");
    },
    onError: () => toast.error("Failed to delete attendance"),
  });
}

// ====================== BOARD EXAM REGISTRATION ======================

export const boardExamKeys = {
  all: ["board-exam-registrations"] as const,
  lists: () => [...boardExamKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...boardExamKeys.lists(), filters] as const,
  details: () => [...boardExamKeys.all, "detail"] as const,
  detail: (id: string) => [...boardExamKeys.details(), id] as const,
};

export function useBoardExamRegistrations(
  filters?: Record<string, unknown>,
) {
  return useQuery({
    queryKey: boardExamKeys.list(filters ?? {}),
    queryFn: () => boardExamApi.list(filters),
  });
}

export function useBoardExamRegistration(id: string) {
  return useQuery({
    queryKey: boardExamKeys.detail(id),
    queryFn: () => boardExamApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateBoardExamRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBoardExamRegistrationInput) =>
      boardExamApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardExamKeys.lists() });
      toast.success("Board exam registration created");
    },
    onError: () => toast.error("Failed to create board exam registration"),
  });
}

export function useUpdateBoardExamRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateBoardExamRegistrationInput;
    }) => boardExamApi.update(id, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: boardExamKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: boardExamKeys.lists() });
      toast.success("Board exam registration updated");
    },
    onError: () => toast.error("Failed to update board exam registration"),
  });
}

export function useDeleteBoardExamRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => boardExamApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardExamKeys.lists() });
      toast.success("Board exam registration deleted");
    },
    onError: () => toast.error("Failed to delete board exam registration"),
  });
}
