import { memo } from "react";
import { View, Text } from "react-native";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Ionicons } from "@expo/vector-icons";
import { formatDate } from "../../utils/format";
import type { Exam } from "../../types/exam.types";

interface ExamCardProps {
  exam: Exam;
  onPress: () => void;
}

export const ExamCard = memo(function ExamCard({
  exam,
  onPress,
}: ExamCardProps) {
  return (
    <Card onPress={onPress}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-base font-sans-semibold text-gray-900 dark:text-gray-100">
            {exam.name}
          </Text>
          <Text className="text-sm font-sans text-muted mt-1">
            {exam.examType} • {exam.academicYear?.name}
          </Text>
          {exam.startDate && (
            <View className="flex-row items-center mt-2 gap-1">
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text className="text-xs font-sans text-muted">
                {formatDate(exam.startDate)}
                {exam.endDate ? ` – ${formatDate(exam.endDate)}` : ""}
              </Text>
            </View>
          )}
        </View>
        <Badge label={exam.status.replace("_", " ")} status={exam.status} />
      </View>
    </Card>
  );
});
