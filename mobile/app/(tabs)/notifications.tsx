import { useCallback } from "react";
import { View, Text, FlatList, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from "../../src/hooks/useNotifications";
import { ScreenWrapper } from "../../src/components/layout/ScreenWrapper";
import { NotificationItem } from "../../src/components/domain/NotificationItem";
import { LoadingScreen } from "../../src/components/ui/LoadingScreen";
import { EmptyState } from "../../src/components/ui/EmptyState";
import type { Notification } from "../../src/types/notification.types";

export function NotificationsScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications: Notification[] = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handlePress = useCallback(
    (notification: Notification) => {
      if (!notification.readAt) {
        markRead.mutate(notification.id);
      }

      // Deep link based on notification type
      switch (notification.type) {
        case "EXAM_PUBLISHED":
          if (notification.referenceId) {
            router.push(`/(tabs)/academics/${notification.referenceId}`);
          }
          break;
        case "PAYMENT_RECEIVED":
          if (notification.referenceId) {
            router.push(`/(tabs)/finance/payment/${notification.referenceId}`);
          }
          break;
        default:
          break;
      }
    },
    [markRead, router],
  );

  if (isLoading) return <LoadingScreen message="Loading notifications..." />;

  return (
    <ScreenWrapper
      title="Notifications"
      headerRight={
        unreadCount > 0 ? (
          <Pressable onPress={() => markAllRead.mutate()} className="px-2 py-1">
            <Text className="text-sm font-sans-medium text-primary-600 dark:text-primary-400">
              Mark all read
            </Text>
          </Pressable>
        ) : undefined
      }
    >
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handlePress(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            message="No notifications yet"
          />
        }
      />
    </ScreenWrapper>
  );
}

export default NotificationsScreen;
