import { View, Text, Switch } from "react-native";
import { useColorScheme } from "nativewind";
import { useUIStore } from "../../../src/stores/ui.store";
import { ScreenWrapper } from "../../../src/components/layout/ScreenWrapper";
import { Card } from "../../../src/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";

export function AppSettingsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { biometricEnabled, pushEnabled, toggleBiometric, togglePush } =
    useUIStore();

  const isDark = colorScheme === "dark";

  return (
    <ScreenWrapper title="App Settings" showBack>
      <View className="p-4 gap-3">
        {/* Appearance */}
        <Text className="text-sm font-sans-semibold text-muted uppercase mb-1">
          Appearance
        </Text>
        <Card>
          <SettingRow
            icon="moon-outline"
            label="Dark Mode"
            value={isDark}
            onToggle={(val) => setColorScheme(val ? "dark" : "light")}
          />
        </Card>

        {/* Security */}
        <Text className="text-sm font-sans-semibold text-muted uppercase mt-4 mb-1">
          Security
        </Text>
        <Card>
          <SettingRow
            icon="finger-print-outline"
            label="Biometric Login"
            value={biometricEnabled}
            onToggle={toggleBiometric}
          />
        </Card>

        {/* Notifications */}
        <Text className="text-sm font-sans-semibold text-muted uppercase mt-4 mb-1">
          Notifications
        </Text>
        <Card>
          <SettingRow
            icon="notifications-outline"
            label="Push Notifications"
            value={pushEnabled}
            onToggle={togglePush}
          />
        </Card>
      </View>
    </ScreenWrapper>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onToggle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <View className="flex-row items-center gap-3">
        <Ionicons name={icon} size={20} color="#6b7280" />
        <Text className="text-base font-sans text-gray-900 dark:text-gray-100">
          {label}
        </Text>
      </View>
      <Switch value={value} onValueChange={onToggle} />
    </View>
  );
}

export default AppSettingsScreen;
