import { View } from "react-native";

export function Divider({ className = "" }: { className?: string }) {
  return <View className={`h-px bg-gray-200 dark:bg-gray-700 ${className}`} />;
}
