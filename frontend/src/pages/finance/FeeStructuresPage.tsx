import { useState } from "react";
import {
  useFeeStructures,
  useCreateFeeStructure,
} from "../../hooks/useFinance";
import { useAcademicYears } from "../../hooks/useAcademic";
import { PageHeader } from "../../components/layout/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { FormField } from "../../components/ui/FormField";
import { formatNPR } from "../../utils/format-currency";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { FeeStructure } from "../../types/finance.types";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  feeType: z.enum([
    "TUITION",
    "ADMISSION",
    "EXAM",
    "LAB",
    "LIBRARY",
    "TRANSPORT",
    "OTHER",
  ]),
  amount: z.coerce.number().positive("Amount must be positive"),
  academicYearId: z.string().min(1, "Academic year required"),
  level: z.coerce.number().optional(),
  stream: z
    .enum(["SCIENCE", "MANAGEMENT", "HUMANITIES", "EDUCATION"])
    .optional(),
});

type FormData = z.infer<typeof schema>;

const columns = [
  { key: "name", header: "Name" },
  { key: "feeType", header: "Type" },
  {
    key: "amount",
    header: "Amount",
    render: (f: FeeStructure) => formatNPR(f.amount),
  },
  {
    key: "level",
    header: "Level",
    render: (f: FeeStructure) => f.level ?? "All",
  },
  {
    key: "stream",
    header: "Stream",
    render: (f: FeeStructure) => f.stream ?? "All",
  },
];

export function FeeStructuresPage() {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, isError, refetch } = useFeeStructures();
  const { data: years } = useAcademicYears();
  const createFee = useCreateFeeStructure();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { feeType: "TUITION" },
  });

  const onSubmit = async (formData: FormData) => {
    await createFee.mutateAsync(formData);
    reset();
    setShowForm(false);
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState
        message="Failed to load fee structures"
        onRetry={() => refetch()}
      />
    );

  return (
    <div>
      <PageHeader
        title="Fee Structures"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? "Cancel" : "Add Fee"}
          </button>
        }
      />
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit as never)}
          className="card mb-6 max-w-2xl space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Name" error={errors.name?.message} required>
              <input
                {...register("name")}
                className="input"
                placeholder="Tuition Fee"
              />
            </FormField>
            <FormField
              label="Fee Type"
              error={errors.feeType?.message}
              required
            >
              <select {...register("feeType")} className="input">
                <option value="TUITION">Tuition</option>
                <option value="ADMISSION">Admission</option>
                <option value="EXAM">Exam</option>
                <option value="LAB">Lab</option>
                <option value="LIBRARY">Library</option>
                <option value="TRANSPORT">Transport</option>
                <option value="OTHER">Other</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              label="Amount (NPR)"
              error={errors.amount?.message}
              required
            >
              <input
                type="number"
                step="0.01"
                {...register("amount")}
                className="input"
              />
            </FormField>
            <FormField
              label="Academic Year"
              error={errors.academicYearId?.message}
              required
            >
              <select {...register("academicYearId")} className="input">
                <option value="">Select</option>
                {years?.data?.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Level" error={errors.level?.message}>
              <select {...register("level")} className="input">
                <option value="">All</option>
                <option value="11">11</option>
                <option value="12">12</option>
              </select>
            </FormField>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Creating..." : "Create Fee Structure"}
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
