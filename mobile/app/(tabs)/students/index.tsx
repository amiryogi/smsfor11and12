import { useState, useCallback } from "react";
import { FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useInfiniteStudents } from "../../../src/hooks/useStudents";
import { ScreenWrapper } from "../../../src/components/layout/ScreenWrapper";
import { StudentCard } from "../../../src/components/domain/StudentCard";
import { SearchBar } from "../../../src/components/ui/SearchBar";
import { EmptyState } from "../../../src/components/ui/EmptyState";

export function StudentsListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data, fetchNextPage, hasNextPage, isLoading, refetch, isRefetching } =
    useInfiniteStudents({ search });

  const students = data?.pages.flatMap((page: any) => page.data) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  return (
    <ScreenWrapper title="Students">
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search by name..."
      />
      <FlatList
        data={students}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <StudentCard
            student={item}
            onPress={() => router.push(`/(tabs)/students/${item.id}`)}
          />
        )}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState message="No students found" icon="people" />
          ) : null
        }
        contentContainerClassName="p-4 gap-3"
      />
    </ScreenWrapper>
  );
}

export default StudentsListScreen;
