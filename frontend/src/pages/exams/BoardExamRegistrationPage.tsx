import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useBoardExamRegistrations,
  useCreateBoardExamRegistration,
  useDeleteBoardExamRegistration,
} from "../../hooks/useAttendance";
import { useAcademicYears } from "../../hooks/useAcademic";
import { PageHeader } from "../../components/layout/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { FormField } from "../../components/ui/FormField";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { formatDate } from "../../utils/format-date";
import type { BoardExamRegistration } from "../../types/attendance.types";

const registerSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  symbolNo: z.string().min(1, "Symbol number is required"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const columns = [
  {
    key: "symbolNo",
    header: "Symbol No.",
  },
  {
    key: "student",
    header: "Student",
    render: (r: BoardExamRegistration) =>
      r.student
        ? `${r.student.firstName} ${r.student.lastName} (${r.student.registrationNo})`
        : "-",
  },
  {
    key: "academicYear",
    header: "Academic Year",
    render: (r: BoardExamRegistration) => r.academicYear?.name ?? "-",
  },
  {
    key: "createdAt",
    header: "Registered On",
    render: (r: BoardExamRegistration) => formatDate(r.createdAt),
  },
];

export function BoardExamRegistrationPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useBoardExamRegistrations({
    page,
    limit: 20,
  });
  const { data: yearsData } = useAcademicYears();
  const createMutation = useCreateBoardExamRegistration();
  const deleteMutation = useDeleteBoardExamRegistration();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        reset();
        setShowForm(false);
      },
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState
        message="Failed to load board exam registrations"
        onRetry={() => refetch()}
      />
    );

  return (
    <div>
      <PageHeader
        title="Board Exam Registration"
        description="NEB symbol number assignment for Grade 12 students"
        action={
          <button
            className="btn-primary"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Cancel" : "Register Student"}
          </button>
        }
      />

      {showForm && (
        <div className="card mb-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            New Registration
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                label="Student ID"
                error={errors.studentId?.message}
                required
              >
                <input
                  type="text"
                  {...register("studentId")}
                  className="input"
                  placeholder="Student UUID"
                />
              </FormField>

              <FormField
                label="Academic Year"
                error={errors.academicYearId?.message}
                required
              >
                <select
                  {...register("academicYearId")}
                  className="input"
                >
                  <option value="">Select year</option>
                  {yearsData?.data?.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Symbol No."
                error={errors.symbolNo?.message}
                required
              >
                <input
                  type="text"
                  {...register("symbolNo")}
                  className="input"
                  placeholder="e.g. 12345"
                />
              </FormField>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending ? "Registering..." : "Register"}
              </button>
            </div>
          </form>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        pagination={data?.meta}
        onPageChange={setPage}
        keyExtractor={(r) => r.id}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Registration"
        message="Are you sure you want to remove this board exam registration?"
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget, {
              onSettled: () => setDeleteTarget(null),
            });
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
