import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useCreateStudent } from "../../hooks/useStudents";
import { FormField } from "../../components/ui/FormField";
import { PageHeader } from "../../components/layout/PageHeader";

const studentSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  registrationNo: z
    .string()
    .min(1, "Registration number is required")
    .regex(/^[0-9-]+$/, "Only digits and hyphens"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

export function StudentCreatePage() {
  const navigate = useNavigate();
  const createStudent = useCreateStudent();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: { gender: "MALE" },
  });

  const onSubmit = async (data: StudentFormData) => {
    await createStudent.mutateAsync(data);
    navigate("/students");
  };

  return (
    <div>
      <PageHeader title="Register Student" />
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
        <FormField
          label="NEB Registration No."
          error={errors.registrationNo?.message}
          required
        >
          <input
            {...register("registrationNo")}
            className="input"
            placeholder="e.g. 12345-678"
          />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Date of Birth" error={errors.dob?.message} required>
            <input type="date" {...register("dob")} className="input" />
          </FormField>
          <FormField label="Gender" error={errors.gender?.message} required>
            <select {...register("gender")} className="input">
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </FormField>
        </div>
        <FormField label="Phone" error={errors.phone?.message}>
          <input {...register("phone")} className="input" />
        </FormField>
        <FormField label="Address" error={errors.address?.message}>
          <textarea {...register("address")} className="input" rows={2} />
        </FormField>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Saving..." : "Register Student"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/students")}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
