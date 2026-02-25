import { memo } from "react";
import { Pressable, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatRelativeTime } from "../../utils/format";

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    body: string;
    type: string;
    isRead: boolean;
    createdAt: string;
  };
  onPress: () => void;
}

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  EXAM_PUBLISHED: "school",
  PAYMENT_RECEIVED: "wallet",
  PDF_READY: "document-text",
  JOB_FAILED: "alert-circle",
  GENERAL: "notifications",
};

export const NotificationItem = memo(function NotificationItem({
  notification,
  onPress,
}: NotificationItemProps) {
  const icon = TYPE_ICONS[notification.type] ?? "notifications";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={notification.title}
      className={`flex-row items-start gap-3 px-4 py-3.5
        ${notification.isRead ? "bg-white dark:bg-gray-900" : "bg-primary-50 dark:bg-primary-900/20"}
      `}
    >
      <View className="bg-primary-100 dark:bg-primary-800 rounded-full p-2 mt-0.5">
        <Ionicons name={icon} size={18} color="#2563EB" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-sans-medium text-gray-900 dark:text-gray-100">
          {notification.title}
        </Text>
        <Text className="text-sm font-sans text-muted mt-0.5" numberOfLines={2}>
          {notification.body}
        </Text>
        <Text className="text-xs font-sans text-muted mt-1">
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>
      {!notification.isRead && (
        <View className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-2" />
      )}
    </Pressable>
  );
});
