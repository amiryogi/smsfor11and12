import { useOutstandingReport } from "../../hooks/useReports";
import { PageHeader } from "../../components/layout/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { formatNPR } from "../../utils/format-currency";
import type { OutstandingStudent } from "../../types/report.types";

const columns = [
  { key: "registrationNo", header: "Reg. No." },
  {
    key: "name",
    header: "Student",
    render: (s: OutstandingStudent) => `${s.firstName} ${s.lastName}`,
  },
  { key: "gradeName", header: "Grade" },
  {
    key: "totalOutstanding",
    header: "Outstanding",
    render: (s: OutstandingStudent) => formatNPR(s.totalOutstanding),
  },
];

export function OutstandingPage() {
  const { data, isLoading, isError, refetch } = useOutstandingReport();

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState
        message="Failed to load outstanding balances"
        onRetry={() => refetch()}
      />
    );

  return (
    <div>
      <PageHeader title="Outstanding Balances" />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        keyExtractor={(item) => item.studentId}
      />
    </div>
  );
}
