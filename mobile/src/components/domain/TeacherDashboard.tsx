import { View, Text } from "react-native";
import { useExams } from "../../hooks/useExams";
import { StatCard } from "../ui/StatCard";

export function TeacherDashboard() {
  const { data: exams } = useExams({ status: "MARKS_ENTRY" });

  const pendingMarksCount = exams?.data?.length ?? 0;

  return (
    <View className="p-4 gap-4">
      <Text className="text-xl font-sans-bold text-gray-900 dark:text-gray-100">
        Teacher Dashboard
      </Text>

      <View className="flex-row flex-wrap gap-3">
        <StatCard
          title="Pending Marks Entry"
          value={pendingMarksCount}
          icon="create"
          color="warning"
        />
        <StatCard title="My Classes" value="-" icon="school" color="primary" />
      </View>

      {pendingMarksCount > 0 && (
        <View className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-800">
          <Text className="text-sm font-sans-medium text-amber-800 dark:text-amber-200">
            You have {pendingMarksCount} exam(s) awaiting marks entry.
          </Text>
        </View>
      )}
    </View>
  );
}
