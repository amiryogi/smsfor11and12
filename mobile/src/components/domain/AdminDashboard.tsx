import { View, Text } from "react-native";
import { useStudentSummary, useFinanceSummary } from "../../hooks/useReports";
import { StatCard } from "../ui/StatCard";
import { RevenueChart } from "./RevenueChart";
import { formatNPR } from "../../utils/format";

export function AdminDashboard() {
  const { data: studentStats } = useStudentSummary();
  const { data: financeStats } = useFinanceSummary();

  return (
    <View className="p-4 gap-4">
      <Text className="text-xl font-sans-bold text-gray-900 dark:text-gray-100">
        School Overview
      </Text>

      <View className="flex-row flex-wrap gap-3">
        <StatCard
          title="Active Students"
          value={studentStats?.data?.activeCount ?? 0}
          icon="people"
          color="primary"
        />
        <StatCard
          title="Revenue (This Month)"
          value={formatNPR(financeStats?.data?.monthlyRevenue ?? 0)}
          icon="wallet"
          color="success"
        />
        <StatCard
          title="Pending Invoices"
          value={financeStats?.data?.pendingInvoiceCount ?? 0}
          icon="alert-circle"
          color="warning"
        />
        <StatCard
          title="Outstanding"
          value={formatNPR(financeStats?.data?.totalOutstanding ?? 0)}
          icon="trending-down"
          color="danger"
        />
      </View>

      <RevenueChart data={financeStats?.data?.monthlyBreakdown ?? []} />
    </View>
  );
}
