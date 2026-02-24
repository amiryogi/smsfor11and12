import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExams, useCreateExam } from "../../hooks/useExams";
import { useAcademicYears } from "../../hooks/useAcademic";
import { PageHeader } from "../../components/layout/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { FormField } from "../../components/ui/FormField";
import { formatDate } from "../../utils/format-date";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Exam } from "../../types/exam.types";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  examType: z.enum(["UNIT_TEST", "TERMINAL", "PREBOARD", "FINAL"]),
  academicYearId: z.string().min(1, "Academic year required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const columns = [
  { key: "name", header: "Exam Name" },
  {
    key: "examType",
    header: "Type",
    render: (e: Exam) => e.examType.replace(/_/g, " "),
  },
  {
    key: "status",
    header: "Status",
    render: (e: Exam) => <StatusBadge status={e.status} />,
  },
  {
    key: "startDate",
    header: "Start",
    render: (e: Exam) => formatDate(e.startDate),
  },
  { key: "endDate", header: "End", render: (e: Exam) => formatDate(e.endDate) },
];

export function ExamsListPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useExams({ page, limit: 20 });
  const { data: years } = useAcademicYears();
  const createExam = useCreateExam();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { examType: "TERMINAL" },
  });

  const onSubmit = async (formData: FormData) => {
    await createExam.mutateAsync(formData);
    reset();
    setShowForm(false);
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState message="Failed to load exams" onRetry={() => refetch()} />
    );

  return (
    <div>
      <PageHeader
        title="Exams"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? "Cancel" : "Create Exam"}
          </button>
        }
      />
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="card mb-6 max-w-2xl space-y-4"
        >
          <FormField label="Exam Name" error={errors.name?.message} required>
            <input
              {...register("name")}
              className="input"
              placeholder="First Terminal 2081"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type" error={errors.examType?.message} required>
              <select {...register("examType")} className="input">
                <option value="UNIT_TEST">Unit Test</option>
                <option value="TERMINAL">Terminal</option>
                <option value="PREBOARD">Pre-board</option>
                <option value="FINAL">Final</option>
              </select>
            </FormField>
            <FormField
              label="Academic Year"
              error={errors.academicYearId?.message}
              required
            >
              <select {...register("academicYearId")} className="input">
                <option value="">Select year</option>
                {years?.data?.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date" error={errors.startDate?.message}>
              <input type="date" {...register("startDate")} className="input" />
            </FormField>
            <FormField label="End Date" error={errors.endDate?.message}>
              <input type="date" {...register("endDate")} className="input" />
            </FormField>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Creating..." : "Create Exam"}
          </button>
        </form>
      )}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        pagination={data?.meta}
        onPageChange={setPage}
        onRowClick={(item) => navigate(`/exams/${item.id}`)}
      />
    </div>
  );
}
