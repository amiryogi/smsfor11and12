import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "./Button";

interface EmptyStateProps {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  message,
  icon = "folder-open",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-8">
      <Ionicons name={icon} size={48} color="#9CA3AF" />
      <Text className="text-base font-sans text-muted text-center mt-4">
        {message}
      </Text>
      {actionLabel && onAction && (
        <View className="mt-4">
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="outline"
            fullWidth={false}
          />
        </View>
      )}
    </View>
  );
}
