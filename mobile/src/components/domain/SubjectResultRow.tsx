import { memo } from "react";
import { View, Text } from "react-native";
import { GRADE_COLORS } from "../../constants/colors";
import type { ExamResult } from "../../types/exam.types";

interface SubjectResultRowProps {
  result: ExamResult;
}

export const SubjectResultRow = memo(function SubjectResultRow({
  result,
}: SubjectResultRowProps) {
  const gradeColor = GRADE_COLORS[result.finalGrade] ?? "text-gray-500";

  return (
    <View className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-800">
      {/* Subject name */}
      <View className="flex-1">
        <Text className="text-sm font-sans-medium text-gray-900 dark:text-gray-100">
          {result.subjectName}
        </Text>
        <Text className="text-xs font-sans text-muted">
          {result.subjectCode}
        </Text>
      </View>

      {/* Marks */}
      <View className="items-center w-16">
        <Text className="text-sm font-sans text-gray-700 dark:text-gray-300">
          {result.theoryMarksObtained ?? "-"}/{result.theoryFullMarks}
        </Text>
        <Text className="text-xs font-sans text-muted">Theory</Text>
      </View>

      {result.practicalFullMarks && (
        <View className="items-center w-16">
          <Text className="text-sm font-sans text-gray-700 dark:text-gray-300">
            {result.practicalMarksObtained ?? "-"}/{result.practicalFullMarks}
          </Text>
          <Text className="text-xs font-sans text-muted">Practical</Text>
        </View>
      )}

      {/* Grade */}
      <View className="items-center w-12">
        <Text className={`text-lg font-sans-bold ${gradeColor}`}>
          {result.finalGrade}
        </Text>
        <Text className="text-xs font-sans text-muted">
          {result.finalGradePoint?.toFixed(1)}
        </Text>
      </View>
    </View>
  );
});
