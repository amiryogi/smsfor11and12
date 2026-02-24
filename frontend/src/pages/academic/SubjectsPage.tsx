import { useState } from "react";
import {
  useSubjects,
  useCreateSubject,
  useDeleteSubject,
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
import type { Subject } from "../../types/academic.types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  creditHours: z.coerce.number().min(1).optional(),
  hasTheory: z.boolean().optional(),
  hasPractical: z.boolean().optional(),
  theoryFullMarks: z.coerce.number().min(0).optional(),
  practicalFullMarks: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

const columns = [
  { key: "code", header: "Code" },
  { key: "name", header: "Name" },
  { key: "creditHours", header: "Credits" },
  { key: "theoryFullMarks", header: "Theory" },
  { key: "practicalFullMarks", header: "Practical" },
];

export function SubjectsPage() {
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useSubjects();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      creditHours: 4,
      hasTheory: true,
      hasPractical: false,
      theoryFullMarks: 75,
      practicalFullMarks: 25,
    },
  });

  const onSubmit = async (formData: FormData) => {
    await createSubject.mutateAsync(formData);
    reset();
    setShowForm(false);
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState message="Failed to load subjects" onRetry={() => refetch()} />
    );

  return (
    <div>
      <PageHeader
        title="Subjects"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? "Cancel" : "Add Subject"}
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
                placeholder="Physics"
              />
            </FormField>
            <FormField label="Code" error={errors.code?.message} required>
              <input
                {...register("code")}
                className="input"
                placeholder="PHY"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Credit Hours" error={errors.creditHours?.message}>
              <input
                type="number"
                {...register("creditHours")}
                className="input"
              />
            </FormField>
            <FormField
              label="Theory Full Marks"
              error={errors.theoryFullMarks?.message}
            >
              <input
                type="number"
                {...register("theoryFullMarks")}
                className="input"
              />
            </FormField>
            <FormField
              label="Practical Full Marks"
              error={errors.practicalFullMarks?.message}
            >
              <input
                type="number"
                {...register("practicalFullMarks")}
                className="input"
              />
            </FormField>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register("hasTheory")}
                className="rounded"
              />{" "}
              Has Theory
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register("hasPractical")}
                className="rounded"
              />{" "}
              Has Practical
            </label>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Creating..." : "Create Subject"}
          </button>
        </form>
      )}
      <DataTable
        columns={[
          ...columns,
          {
            key: "actions",
            header: "",
            render: (s: Subject) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(s.id);
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
        title="Delete Subject"
        message="Are you sure you want to delete this subject?"
        variant="danger"
        confirmLabel="Delete"
        onConfirm={async () => {
          if (deleteId) {
            await deleteSubject.mutateAsync(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
