import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { OfflineBanner } from "./OfflineBanner";

interface ScreenWrapperProps {
  title?: string;
  showBack?: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export function ScreenWrapper({
  title,
  showBack = false,
  headerRight,
  children,
}: ScreenWrapperProps) {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <OfflineBanner />

      {/* Header */}
      {title && (
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center gap-3">
            {showBack && (
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={24} color="#1E40AF" />
              </Pressable>
            )}
            <Text className="text-xl font-sans-bold text-gray-900 dark:text-gray-100">
              {title}
            </Text>
          </View>
          {headerRight && <View>{headerRight}</View>}
        </View>
      )}

      {/* Content */}
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
