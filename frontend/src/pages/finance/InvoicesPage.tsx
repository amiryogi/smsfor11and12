import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoices } from "../../hooks/useFinance";
import { PageHeader } from "../../components/layout/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { formatNPR } from "../../utils/format-currency";
import { formatDate } from "../../utils/format-date";
import type { Invoice } from "../../types/finance.types";

const columns = [
  { key: "invoiceNo", header: "Invoice #" },
  {
    key: "student",
    header: "Student",
    render: (i: Invoice) =>
      i.student ? `${i.student.firstName} ${i.student.lastName}` : "-",
  },
  {
    key: "totalAmount",
    header: "Total",
    render: (i: Invoice) => formatNPR(i.totalAmount),
  },
  {
    key: "paidAmount",
    header: "Paid",
    render: (i: Invoice) => formatNPR(i.paidAmount),
  },
  {
    key: "dueDate",
    header: "Due",
    render: (i: Invoice) => formatDate(i.dueDate),
  },
  {
    key: "status",
    header: "Status",
    render: (i: Invoice) => <StatusBadge status={i.status} />,
  },
];

export function InvoicesPage() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useInvoices({
    page,
    limit: 20,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState message="Failed to load invoices" onRetry={() => refetch()} />
    );

  return (
    <div>
      <PageHeader title="Invoices" />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        pagination={data?.meta}
        onPageChange={setPage}
        onRowClick={(item) => navigate(`/finance/invoices/${item.id}`)}
      />
    </div>
  );
}
