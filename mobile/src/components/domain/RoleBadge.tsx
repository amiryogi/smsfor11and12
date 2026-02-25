import { View, Text } from "react-native";

const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  SUPER_ADMIN: {
    bg: "bg-purple-100 dark:bg-purple-900",
    text: "text-purple-700 dark:text-purple-300",
  },
  ADMIN: {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-700 dark:text-blue-300",
  },
  TEACHER: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-700 dark:text-green-300",
  },
  ACCOUNTANT: {
    bg: "bg-amber-100 dark:bg-amber-900",
    text: "text-amber-700 dark:text-amber-300",
  },
  PARENT: {
    bg: "bg-teal-100 dark:bg-teal-900",
    text: "text-teal-700 dark:text-teal-300",
  },
  STUDENT: {
    bg: "bg-indigo-100 dark:bg-indigo-900",
    text: "text-indigo-700 dark:text-indigo-300",
  },
};

export function RoleBadge({ role }: { role: string }) {
  const style = ROLE_STYLES[role] ?? ROLE_STYLES.STUDENT;

  return (
    <View className={`px-3 py-1 rounded-full ${style.bg} mt-1`}>
      <Text className={`text-xs font-sans-semibold ${style.text}`}>
        {role.replace(/_/g, " ")}
      </Text>
    </View>
  );
}
