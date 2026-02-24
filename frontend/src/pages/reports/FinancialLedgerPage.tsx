import { useState } from "react";
import { useFinancialLedger } from "../../hooks/useReports";
import { PageHeader } from "../../components/layout/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { formatNPR } from "../../utils/format-currency";
import { formatDate } from "../../utils/format-date";
import { FormField } from "../../components/ui/FormField";

export function FinancialLedgerPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { data, isLoading, isError, refetch } = useFinancialLedger({
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  });

  return (
    <div>
      <PageHeader title="Financial Ledger" />
      <div className="mb-6 flex gap-4">
        <FormField label="From">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input w-48"
          />
        </FormField>
        <FormField label="To">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input w-48"
          />
        </FormField>
      </div>
      {isLoading && <LoadingSpinner />}
      {isError && (
        <ErrorState message="Failed to load ledger" onRetry={() => refetch()} />
      )}
      {data?.data && (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Description
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">
                  Debit
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">
                  Credit
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.data.map((entry, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2">{formatDate(entry.date)}</td>
                  <td className="px-4 py-2">{entry.description}</td>
                  <td className="px-4 py-2 text-right">
                    {entry.debit > 0 ? formatNPR(entry.debit) : "-"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {entry.credit > 0 ? formatNPR(entry.credit) : "-"}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatNPR(entry.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
