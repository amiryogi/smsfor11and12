import { View, Text, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useStudents } from "../../../src/hooks/useStudents";
import { useAuthStore } from "../../../src/stores/auth.store";
import { ScreenWrapper } from "../../../src/components/layout/ScreenWrapper";
import { StudentCard } from "../../../src/components/domain/StudentCard";
import { LoadingScreen } from "../../../src/components/ui/LoadingScreen";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import type { Student } from "../../../src/types/student.types";

export function MyChildrenScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, refetch, isRefetching } = useStudents({
    parentId: user?.id,
  });

  if (isLoading) return <LoadingScreen message="Loading children..." />;

  const children: Student[] = data?.data ?? [];

  return (
    <ScreenWrapper title="My Children" showBack>
      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        renderItem={({ item }) => (
          <StudentCard
            student={item}
            onPress={() => router.push(`/(tabs)/students/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            message="No children linked to your account"
          />
        }
      />
    </ScreenWrapper>
  );
}

export default MyChildrenScreen;
