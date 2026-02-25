import { View, Text } from "react-native";
import { useFinanceSummary } from "../../hooks/useReports";
import { StatCard } from "../ui/StatCard";
import { formatNPR } from "../../utils/format";

export function AccountantDashboard() {
  const { data: financeStats } = useFinanceSummary();

  return (
    <View className="p-4 gap-4">
      <Text className="text-xl font-sans-bold text-gray-900 dark:text-gray-100">
        Finance Overview
      </Text>

      <View className="flex-row flex-wrap gap-3">
        <StatCard
          title="Today's Collections"
          value={formatNPR(financeStats?.data?.todayCollections ?? 0)}
          icon="cash"
          color="success"
        />
        <StatCard
          title="Outstanding"
          value={formatNPR(financeStats?.data?.totalOutstanding ?? 0)}
          icon="alert-circle"
          color="danger"
        />
        <StatCard
          title="Pending Invoices"
          value={financeStats?.data?.pendingInvoiceCount ?? 0}
          icon="document-text"
          color="warning"
        />
        <StatCard
          title="This Month"
          value={formatNPR(financeStats?.data?.monthlyRevenue ?? 0)}
          icon="trending-up"
          color="primary"
        />
      </View>
    </View>
  );
}
