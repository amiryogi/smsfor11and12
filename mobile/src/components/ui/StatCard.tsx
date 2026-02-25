import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";

type StatColor = "primary" | "success" | "warning" | "danger";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: StatColor;
}

const COLOR_MAP: Record<StatColor, { bg: string; icon: string }> = {
  primary: {
    bg: "bg-primary-50 dark:bg-primary-900/30",
    icon: COLORS.primary[600],
  },
  success: { bg: "bg-green-50 dark:bg-green-900/30", icon: COLORS.success },
  warning: { bg: "bg-amber-50 dark:bg-amber-900/30", icon: COLORS.warning },
  danger: { bg: "bg-red-50 dark:bg-red-900/30", icon: COLORS.danger },
};

export function StatCard({ title, value, icon, color }: StatCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <View
      className={`${colors.bg} rounded-2xl p-4 flex-1 min-w-[45%] border border-gray-100 dark:border-gray-700`}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <Ionicons name={icon} size={20} color={colors.icon} />
        <Text className="text-xs font-sans-medium text-muted">{title}</Text>
      </View>
      <Text className="text-xl font-sans-bold text-gray-900 dark:text-gray-100">
        {typeof value === "number" ? value.toLocaleString() : value}
      </Text>
    </View>
  );
}
