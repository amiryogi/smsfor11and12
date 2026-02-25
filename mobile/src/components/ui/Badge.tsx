import { View, Text } from "react-native";
import { STATUS_COLORS } from "../../constants/colors";

interface BadgeProps {
  label: string;
  status?: string;
  className?: string;
}

export function Badge({ label, status, className = "" }: BadgeProps) {
  const colorKey = status ?? label;
  const colors = STATUS_COLORS[colorKey] ?? {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-300",
  };

  return (
    <View className={`px-2.5 py-1 rounded-full ${colors.bg} ${className}`}>
      <Text className={`text-xs font-sans-medium ${colors.text}`}>{label}</Text>
    </View>
  );
}
