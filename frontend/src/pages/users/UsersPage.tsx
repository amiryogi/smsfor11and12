import { useState } from "react";
import { useUsers, useCreateUser, useDeleteUser } from "../../hooks/useUsers";
import { PageHeader } from "../../components/layout/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { SearchInput } from "../../components/ui/SearchInput";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { FormField } from "../../components/ui/FormField";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User } from "../../types/user.types";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "TEACHER", "ACCOUNTANT", "PARENT", "STUDENT"]),
});

type FormData = z.infer<typeof schema>;

const columns = [
  { key: "email", header: "Email" },
  {
    key: "name",
    header: "Name",
    render: (u: User) => `${u.firstName} ${u.lastName}`,
  },
  {
    key: "role",
    header: "Role",
    render: (u: User) => u.role.replace(/_/g, " "),
  },
  {
    key: "isActive",
    header: "Status",
    render: (u: User) => (
      <StatusBadge status={u.isActive ? "ACTIVE" : "SUSPENDED"} />
    ),
  },
];

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useUsers({
    page,
    limit: 20,
    search: search || undefined,
  });
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "TEACHER" },
  });

  const onSubmit = async (formData: FormData) => {
    await createUser.mutateAsync(formData);
    reset();
    setShowForm(false);
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState message="Failed to load users" onRetry={() => refetch()} />
    );

  return (
    <div>
      <PageHeader
        title="Users"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? "Cancel" : "Add User"}
          </button>
        }
      />
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="card mb-6 max-w-2xl space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" error={errors.email?.message} required>
              <input type="email" {...register("email")} className="input" />
            </FormField>
            <FormField
              label="Password"
              error={errors.password?.message}
              required
            >
              <input
                type="password"
                {...register("password")}
                className="input"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Role" error={errors.role?.message} required>
              <select {...register("role")} className="input">
                <option value="ADMIN">Admin</option>
                <option value="TEACHER">Teacher</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="PARENT">Parent</option>
                <option value="STUDENT">Student</option>
              </select>
            </FormField>
            <FormField label="Phone" error={errors.phone?.message}>
              <input {...register("phone")} className="input" />
            </FormField>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Creating..." : "Create User"}
          </button>
        </form>
      )}
      <div className="mb-4 max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search users..."
        />
      </div>
      <DataTable
        columns={[
          ...columns,
          {
            key: "actions",
            header: "",
            render: (u: User) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(u.id);
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
        onPageChange={setPage}
      />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete User"
        message="Are you sure?"
        variant="danger"
        confirmLabel="Delete"
        onConfirm={async () => {
          if (deleteId) {
            await deleteUser.mutateAsync(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
