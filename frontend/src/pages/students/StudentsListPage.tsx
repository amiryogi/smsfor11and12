import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStudents } from "../../hooks/useStudents";
import { DataTable } from "../../components/ui/DataTable";
import { PageHeader } from "../../components/layout/PageHeader";
import { SearchInput } from "../../components/ui/SearchInput";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import type { Student } from "../../types/student.types";

const columns = [
  { key: "registrationNo", header: "Reg. No." },
  {
    key: "name",
    header: "Name",
    render: (s: Student) => `${s.firstName} ${s.lastName}`,
  },
  { key: "gender", header: "Gender" },
  {
    key: "status",
    header: "Status",
    render: (s: Student) => <StatusBadge status={s.status} />,
  },
];

export function StudentsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useStudents({
    page,
    limit: 20,
    search: search || undefined,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState message="Failed to load students" onRetry={() => refetch()} />
    );

  return (
    <div>
      <PageHeader
        title="Students"
        action={
          <Link to="/students/new" className="btn-primary">
            Add Student
          </Link>
        }
      />
      <div className="mb-4 max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name..."
        />
      </div>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        pagination={data?.meta}
        onPageChange={setPage}
        onRowClick={(item) => navigate(`/students/${item.id}`)}
      />
    </div>
  );
}
