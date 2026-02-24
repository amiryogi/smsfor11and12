import { useState } from "react";
import {
  useAcademicYears,
  useCreateAcademicYear,
} from "../../hooks/useAcademic";
import { PageHeader } from "../../components/layout/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { FormField } from "../../components/ui/FormField";
import { formatDate } from "../../utils/format-date";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { AcademicYear } from "../../types/academic.types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isCurrent: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const columns = [
  { key: "name", header: "Name" },
  {
    key: "startDate",
    header: "Start Date",
    render: (y: AcademicYear) => formatDate(y.startDate),
  },
  {
    key: "endDate",
    header: "End Date",
    render: (y: AcademicYear) => formatDate(y.endDate),
  },
  {
    key: "isCurrent",
    header: "Current",
    render: (y: AcademicYear) => (y.isCurrent ? "✓" : "-"),
  },
];

export function AcademicYearsPage() {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, isError, refetch } = useAcademicYears();
  const createYear = useCreateAcademicYear();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (formData: FormData) => {
    await createYear.mutateAsync(formData);
    reset();
    setShowForm(false);
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState
        message="Failed to load academic years"
        onRetry={() => refetch()}
      />
    );

  return (
    <div>
      <PageHeader
        title="Academic Years"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? "Cancel" : "Add Year"}
          </button>
        }
      />
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="card mb-6 max-w-2xl space-y-4"
        >
          <FormField
            label="Name (e.g. 2081)"
            error={errors.name?.message}
            required
          >
            <input {...register("name")} className="input" placeholder="2081" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Start Date"
              error={errors.startDate?.message}
              required
            >
              <input type="date" {...register("startDate")} className="input" />
            </FormField>
            <FormField
              label="End Date"
              error={errors.endDate?.message}
              required
            >
              <input type="date" {...register("endDate")} className="input" />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register("isCurrent")}
              className="rounded"
            />
            Set as current year
          </label>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Creating..." : "Create Year"}
          </button>
        </form>
      )}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        pagination={data?.meta}
      />
    </div>
  );
}
