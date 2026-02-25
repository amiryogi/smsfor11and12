import { View, Text } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Button } from "../src/components/ui/Button";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900 p-6">
        <Text className="text-6xl font-sans-bold text-primary-600 dark:text-primary-400 mb-4">
          404
        </Text>
        <Text className="text-lg font-sans-semibold text-gray-900 dark:text-gray-100 mb-2">
          Page Not Found
        </Text>
        <Text className="text-sm font-sans text-muted text-center mb-6">
          The screen you are looking for does not exist or has been moved.
        </Text>
        <Button title="Go to Home" onPress={() => router.replace("/(tabs)")} />
      </View>
    </>
  );
}
