import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { schoolsApi } from "../../api/schools.api";
import { PageHeader } from "../../components/layout/PageHeader";
import { FormField } from "../../components/ui/FormField";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function SchoolSettingsPage() {
  const queryClient = useQueryClient();
  const {
    data: school,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["school", "current"],
    queryFn: () => schoolsApi.getCurrent(),
  });

  const updateSchool = useMutation({
    mutationFn: (input: FormData) => schoolsApi.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school"] });
      toast.success("School settings updated");
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (school?.data) {
      reset({
        name: school.data.name,
        address: school.data.address ?? "",
        phone: school.data.phone ?? "",
      });
    }
  }, [school, reset]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message="Failed to load school settings" />;

  return (
    <div>
      <PageHeader
        title="School Settings"
        description={`Code: ${school?.data?.code ?? ""}`}
      />
      <form
        onSubmit={handleSubmit((data) => updateSchool.mutate(data))}
        className="card max-w-2xl space-y-4"
      >
        <FormField label="School Name" error={errors.name?.message} required>
          <input {...register("name")} className="input" />
        </FormField>
        <FormField label="Address" error={errors.address?.message}>
          <textarea {...register("address")} className="input" rows={2} />
        </FormField>
        <FormField label="Phone" error={errors.phone?.message}>
          <input {...register("phone")} className="input" />
        </FormField>
        <button
          type="submit"
          disabled={isSubmitting || updateSchool.isPending}
          className="btn-primary"
        >
          {updateSchool.isPending ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
