import { useParams, Link } from "react-router-dom";
import { useInvoice } from "../../hooks/useFinance";
import { PageHeader } from "../../components/layout/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { formatNPR } from "../../utils/format-currency";
import { formatDate } from "../../utils/format-date";

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useInvoice(id!);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <ErrorState message="Failed to load invoice" />;

  const inv = data.data;
  const outstanding = inv.totalAmount - inv.paidAmount;

  return (
    <div>
      <PageHeader
        title={`Invoice ${inv.invoiceNo}`}
        action={
          outstanding > 0 ? (
            <Link
              to={`/finance/payments/new?invoiceId=${inv.id}&studentId=${inv.studentId}`}
              className="btn-primary"
            >
              Record Payment
            </Link>
          ) : undefined
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Invoice Details</h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Invoice No.</dt>
              <dd className="font-medium">{inv.invoiceNo}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd>
                <StatusBadge status={inv.status} />
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Total Amount</dt>
              <dd className="font-medium">{formatNPR(inv.totalAmount)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Paid Amount</dt>
              <dd className="font-medium text-green-600">
                {formatNPR(inv.paidAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Outstanding</dt>
              <dd className="font-medium text-red-600">
                {formatNPR(outstanding)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Due Date</dt>
              <dd className="font-medium">{formatDate(inv.dueDate)}</dd>
            </div>
          </dl>
        </div>
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Line Items</h3>
          {inv.lineItems && inv.lineItems.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-right">Discount</th>
                  <th className="pb-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {inv.lineItems.map((li) => (
                  <tr key={li.id} className="border-b">
                    <td className="py-2">{li.description}</td>
                    <td className="py-2 text-right">{formatNPR(li.amount)}</td>
                    <td className="py-2 text-right">
                      {formatNPR(li.discount)}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatNPR(li.netAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500">No line items</p>
          )}
        </div>
      </div>
    </div>
  );
}
