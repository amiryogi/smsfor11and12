import { View, Text } from "react-native";
import { useExams } from "../../hooks/useExams";
import { useInvoices } from "../../hooks/useFinance";
import { StatCard } from "../ui/StatCard";
import { formatNPR } from "../../utils/format";

export function StudentDashboard() {
  const { data: exams } = useExams({ status: "PUBLISHED" });
  const { data: invoices } = useInvoices({ status: "UNPAID" });

  const pendingAmount =
    invoices?.data?.reduce(
      (sum: number, inv: { balanceDue: number }) => sum + inv.balanceDue,
      0,
    ) ?? 0;

  return (
    <View className="p-4 gap-4">
      <Text className="text-xl font-sans-bold text-gray-900 dark:text-gray-100">
        My Dashboard
      </Text>

      <View className="flex-row flex-wrap gap-3">
        <StatCard
          title="Exam Results"
          value={exams?.data?.length ?? 0}
          icon="school"
          color="primary"
        />
        <StatCard
          title="Pending Fees"
          value={formatNPR(pendingAmount)}
          icon="wallet"
          color="warning"
        />
      </View>
    </View>
  );
}
