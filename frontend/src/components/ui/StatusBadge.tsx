const statusColorMap: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  GRADUATED: "bg-blue-100 text-blue-800",
  DROPOUT: "bg-red-100 text-red-800",
  TRANSFERRED: "bg-yellow-100 text-yellow-800",
  SUSPENDED: "bg-gray-100 text-gray-800",
  DRAFT: "bg-gray-100 text-gray-800",
  MARKS_ENTRY: "bg-yellow-100 text-yellow-800",
  FINALIZED: "bg-blue-100 text-blue-800",
  PUBLISHED: "bg-green-100 text-green-800",
  UNPAID: "bg-red-100 text-red-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  COMPLETED: "bg-green-100 text-green-800",
  REVERSED: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  const colors = statusColorMap[status] ?? "bg-gray-100 text-gray-800";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
