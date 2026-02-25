import { View, Text } from "react-native";
import { useNetInfo } from "@react-native-community/netinfo";

export function OfflineBanner() {
  const netInfo = useNetInfo();

  if (netInfo.isConnected !== false) return null;

  return (
    <View className="bg-warning px-4 py-2">
      <Text className="text-white text-center text-sm font-sans-medium">
        You're offline. Showing cached data.
      </Text>
    </View>
  );
}
