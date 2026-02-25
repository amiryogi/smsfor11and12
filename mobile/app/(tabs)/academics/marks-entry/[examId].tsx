import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, FlatList, Alert } from "react-native";
import { useExam, useBulkEnterMarks } from "../../../../src/hooks/useExams";
import { ScreenWrapper } from "../../../../src/components/layout/ScreenWrapper";
import { FormInput } from "../../../../src/components/forms/FormInput";
import { Button } from "../../../../src/components/ui/Button";
import type { BulkMarksEntry } from "../../../../src/types/exam.types";

interface MarksRow {
  studentId: string;
  studentName: string;
  gradeSubjectId: string;
  theoryMarks: string;
  practicalMarks: string;
}

export function MarksEntryScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const router = useRouter();
  const { data: exam } = useExam(examId!);
  const bulkMutation = useBulkEnterMarks(examId!);
  const [rows, setRows] = useState<MarksRow[]>([]);

  const updateRow = (index: number, field: keyof MarksRow, value: string) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = () => {
    const marks: BulkMarksEntry[] = rows
      .filter((r) => r.theoryMarks || r.practicalMarks)
      .map((r) => ({
        studentId: r.studentId,
        gradeSubjectId: r.gradeSubjectId,
        theoryMarksObtained: Number(r.theoryMarks) || 0,
        practicalMarksObtained: r.practicalMarks
          ? Number(r.practicalMarks)
          : undefined,
      }));

    if (marks.length === 0) {
      Alert.alert("Error", "Please enter marks for at least one student.");
      return;
    }

    bulkMutation.mutate(marks, {
      onSuccess: () => {
        Alert.alert("Success", "Marks saved successfully.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      },
      onError: (error) => {
        Alert.alert(
          "Error",
          (error as { message?: string })?.message || "Failed to save marks.",
        );
      },
    });
  };

  return (
    <ScreenWrapper title="Enter Marks" showBack>
      <View className="p-4">
        <Text className="text-base font-sans-semibold text-gray-900 dark:text-gray-100 mb-4">
          {exam?.data?.name}
        </Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(_, index) => String(index)}
        renderItem={({ item, index }) => (
          <View className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
            <Text className="text-sm font-sans-medium text-gray-900 dark:text-gray-100 mb-2">
              {item.studentName}
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FormInput
                  label="Theory"
                  keyboardType="numeric"
                  value={item.theoryMarks}
                  onChangeText={(v) => updateRow(index, "theoryMarks", v)}
                />
              </View>
              <View className="flex-1">
                <FormInput
                  label="Practical"
                  keyboardType="numeric"
                  value={item.practicalMarks}
                  onChangeText={(v) => updateRow(index, "practicalMarks", v)}
                />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="p-8 items-center">
            <Text className="text-muted font-sans">
              No students found for marks entry.
            </Text>
          </View>
        }
        contentContainerClassName="pb-4"
      />
      <View className="p-4">
        <Button
          title="Save Marks"
          onPress={handleSubmit}
          loading={bulkMutation.isPending}
        />
      </View>
    </ScreenWrapper>
  );
}

export default MarksEntryScreen;
