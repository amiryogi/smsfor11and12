import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useStudent, useUpdateStudent } from "../../hooks/useStudents";
import { FormField } from "../../components/ui/FormField";
import { PageHeader } from "../../components/layout/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { useEffect } from "react";

const editSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().optional(),
  address: z.string().optional(),
  symbolNo: z.string().optional(),
  status: z.enum([
    "ACTIVE",
    "GRADUATED",
    "DROPOUT",
    "TRANSFERRED",
    "SUSPENDED",
  ]),
});

type EditFormData = z.infer<typeof editSchema>;

export function StudentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading, isError } = useStudent(id!);
  const updateStudent = useUpdateStudent(id!);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (student?.data) {
      reset({
        firstName: student.data.firstName,
        lastName: student.data.lastName,
        phone: student.data.phone ?? "",
        address: student.data.address ?? "",
        symbolNo: student.data.symbolNo ?? "",
        status: student.data.status,
      });
    }
  }, [student, reset]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message="Failed to load student" />;

  const onSubmit = async (data: EditFormData) => {
    await updateStudent.mutateAsync(data);
    navigate(`/students/${id}`);
  };

  return (
    <div>
      <PageHeader title="Edit Student" />
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="First Name"
            error={errors.firstName?.message}
            required
          >
            <input {...register("firstName")} className="input" />
          </FormField>
          <FormField
            label="Last Name"
            error={errors.lastName?.message}
            required
          >
            <input {...register("lastName")} className="input" />
          </FormField>
        </div>
        <FormField label="Symbol No." error={errors.symbolNo?.message}>
          <input {...register("symbolNo")} className="input" />
        </FormField>
        <FormField label="Phone" error={errors.phone?.message}>
          <input {...register("phone")} className="input" />
        </FormField>
        <FormField label="Address" error={errors.address?.message}>
          <textarea {...register("address")} className="input" rows={2} />
        </FormField>
        <FormField label="Status" error={errors.status?.message} required>
          <select {...register("status")} className="input">
            <option value="ACTIVE">Active</option>
            <option value="GRADUATED">Graduated</option>
            <option value="DROPOUT">Dropout</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </FormField>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/students/${id}`)}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
