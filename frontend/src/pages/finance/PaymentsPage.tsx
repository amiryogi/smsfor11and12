import { useState } from "react";
import { Link } from "react-router-dom";
import { usePayments } from "../../hooks/useFinance";
import { PageHeader } from "../../components/layout/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { formatNPR } from "../../utils/format-currency";
import { formatDateTime } from "../../utils/format-date";
import type { Payment } from "../../types/finance.types";

const columns = [
  {
    key: "createdAt",
    header: "Date",
    render: (p: Payment) => formatDateTime(p.createdAt),
  },
  {
    key: "student",
    header: "Student",
    render: (p: Payment) =>
      p.student ? `${p.student.firstName} ${p.student.lastName}` : "-",
  },
  {
    key: "amount",
    header: "Amount",
    render: (p: Payment) => formatNPR(p.amount),
  },
  {
    key: "paymentMethod",
    header: "Method",
    render: (p: Payment) => p.paymentMethod.replace(/_/g, " "),
  },
  {
    key: "status",
    header: "Status",
    render: (p: Payment) => <StatusBadge status={p.status} />,
  },
];

export function PaymentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = usePayments({
    page,
    limit: 20,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState message="Failed to load payments" onRetry={() => refetch()} />
    );

  return (
    <div>
      <PageHeader
        title="Payments"
        action={
          <Link to="/finance/payments/new" className="btn-primary">
            New Payment
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        pagination={data?.meta}
        onPageChange={setPage}
      />
    </div>
  );
}
