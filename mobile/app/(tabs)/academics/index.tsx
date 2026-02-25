import { FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useExams } from "../../../src/hooks/useExams";
import { ScreenWrapper } from "../../../src/components/layout/ScreenWrapper";
import { ExamCard } from "../../../src/components/domain/ExamCard";
import { EmptyState } from "../../../src/components/ui/EmptyState";

export function ExamsListScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useExams();

  return (
    <ScreenWrapper title="Exams & Results">
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExamCard
            exam={item}
            onPress={() => router.push(`/(tabs)/academics/${item.id}`)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState message="No exams found" icon="school" />
          ) : null
        }
        contentContainerClassName="p-4 gap-3"
      />
    </ScreenWrapper>
  );
}

export default ExamsListScreen;
