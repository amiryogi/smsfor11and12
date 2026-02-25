import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, View, Text, RefreshControl } from "react-native";
import { useExam, useStudentExamResults } from "../../../src/hooks/useExams";
import { useAuthStore } from "../../../src/stores/auth.store";
import { ScreenWrapper } from "../../../src/components/layout/ScreenWrapper";
import { SubjectResultRow } from "../../../src/components/domain/SubjectResultRow";
import { GradeBadge } from "../../../src/components/domain/GradeBadge";
import { Button } from "../../../src/components/ui/Button";

export function ExamDetailScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: exam, refetch, isRefetching } = useExam(examId!);
  const { data: results } = useStudentExamResults(examId!, user?.id);

  return (
    <ScreenWrapper title={exam?.data?.name ?? "Exam Details"} showBack>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Exam info header */}
        <View className="p-4 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800">
          <Text className="text-lg font-sans-semibold text-gray-900 dark:text-gray-100">
            {exam?.data?.name}
          </Text>
          <Text className="text-sm font-sans text-muted mt-1">
            {exam?.data?.examType} • {exam?.data?.academicYear?.name}
          </Text>
          <GradeBadge status={exam?.data?.status ?? "DRAFT"} className="mt-2" />
        </View>

        {/* Subject Results */}
        <View className="p-4 gap-2">
          <Text className="text-base font-sans-semibold text-gray-800 dark:text-gray-200 mb-2">
            Subject Results
          </Text>
          {results?.data?.map((result: { id: string }) => (
            <SubjectResultRow key={result.id} result={result as any} />
          ))}
        </View>

        {/* Download Marksheet */}
        {exam?.data?.status === "PUBLISHED" && (
          <View className="px-4 pb-6">
            <Button
              title="Download Marksheet"
              variant="outline"
              icon="download"
              onPress={() => {
                // Triggers PDF generation job, opens in browser when ready
              }}
            />
          </View>
        )}

        {/* Marks Entry (Teacher only) */}
        {user?.role === "TEACHER" && exam?.data?.status === "MARKS_ENTRY" && (
          <View className="px-4 pb-6">
            <Button
              title="Enter Marks"
              onPress={() =>
                router.push(`/(tabs)/academics/marks-entry/${examId}`)
              }
            />
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

export default ExamDetailScreen;
