import { useState } from "react";
import {
  useGrades,
  useCreateGrade,
  useDeleteGrade,
} from "../../hooks/useAcademic";
import { PageHeader } from "../../components/layout/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { FormField } from "../../components/ui/FormField";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Grade } from "../../types/academic.types";

const schema = z.object({
  level: z.coerce.number().min(11).max(12),
  section: z.string().min(1, "Section is required"),
  stream: z.enum(["SCIENCE", "MANAGEMENT", "HUMANITIES", "EDUCATION"]),
  capacity: z.coerce.number().min(1).optional(),
});

type FormData = z.infer<typeof schema>;

const columns = [
  { key: "level", header: "Level" },
  { key: "section", header: "Section" },
  { key: "stream", header: "Stream" },
  { key: "capacity", header: "Capacity" },
];

export function GradesPage() {
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useGrades();
  const createGrade = useCreateGrade();
  const deleteGrade = useDeleteGrade();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { level: 11, stream: "SCIENCE" },
  });

  const onSubmit = async (formData: FormData) => {
    await createGrade.mutateAsync(formData);
    reset();
    setShowForm(false);
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState message="Failed to load grades" onRetry={() => refetch()} />
    );

  return (
    <div>
      <PageHeader
        title="Grades"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? "Cancel" : "Add Grade"}
          </button>
        }
      />
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit as never)}
          className="card mb-6 max-w-2xl space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Level" error={errors.level?.message} required>
              <select {...register("level")} className="input">
                <option value={11}>11</option>
                <option value={12}>12</option>
              </select>
            </FormField>
            <FormField label="Section" error={errors.section?.message} required>
              <input
                {...register("section")}
                className="input"
                placeholder="A"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Stream" error={errors.stream?.message} required>
              <select {...register("stream")} className="input">
                <option value="SCIENCE">Science</option>
                <option value="MANAGEMENT">Management</option>
                <option value="HUMANITIES">Humanities</option>
                <option value="EDUCATION">Education</option>
              </select>
            </FormField>
            <FormField label="Capacity" error={errors.capacity?.message}>
              <input
                type="number"
                {...register("capacity")}
                className="input"
                placeholder="60"
              />
            </FormField>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Creating..." : "Create Grade"}
          </button>
        </form>
      )}
      <DataTable
        columns={[
          ...columns,
          {
            key: "actions",
            header: "",
            render: (g: Grade) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(g.id);
                }}
                className="text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            ),
          },
        ]}
        data={data?.data ?? []}
        pagination={data?.meta}
      />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Grade"
        message="Are you sure you want to delete this grade?"
        variant="danger"
        confirmLabel="Delete"
        onConfirm={async () => {
          if (deleteId) {
            await deleteGrade.mutateAsync(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
