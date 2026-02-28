import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAttendanceList, useDeleteAttendance } from "../../hooks/useAttendance";
import { DataTable } from "../../components/ui/DataTable";
import { PageHeader } from "../../components/layout/PageHeader";
import { SearchInput } from "../../components/ui/SearchInput";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { formatDate } from "../../utils/format-date";
import type { Attendance } from "../../types/attendance.types";

const columns = [
  {
    key: "date",
    header: "Date",
    render: (a: Attendance) => formatDate(a.date),
  },
  {
    key: "grade",
    header: "Grade",
    render: (a: Attendance) =>
      a.grade ? `${a.grade.level} ${a.grade.section}` : "-",
  },
  {
    key: "academicYear",
    header: "Academic Year",
    render: (a: Attendance) => a.academicYear?.name ?? "-",
  },
  {
    key: "records",
    header: "Records",
    render: (a: Attendance) => a._count?.records ?? 0,
  },
];

export function AttendancePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useAttendanceList({
    page,
    limit: 20,
    ...(search ? { search } : {}),
  });

  const deleteMutation = useDeleteAttendance();

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState message="Failed to load attendance" onRetry={() => refetch()} />
    );

  return (
    <div>
      <PageHeader
        title="Attendance"
        action={
          <Link to="/attendance/take" className="btn-primary">
            Take Attendance
          </Link>
        }
      />
      <div className="mb-4 max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by date..."
        />
      </div>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        pagination={data?.meta}
        onPageChange={setPage}
        onRowClick={(item) => navigate(`/attendance/${item.id}`)}
        keyExtractor={(a) => a.id}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Attendance"
        message="Are you sure you want to delete this attendance record? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget, {
              onSettled: () => setDeleteTarget(null),
            });
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
