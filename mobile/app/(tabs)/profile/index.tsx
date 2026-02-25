import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../../src/stores/auth.store";
import { useLogout } from "../../../src/hooks/useAuth";
import { ScreenWrapper } from "../../../src/components/layout/ScreenWrapper";
import { Avatar } from "../../../src/components/ui/Avatar";
import { RoleBadge } from "../../../src/components/domain/RoleBadge";
import { Divider } from "../../../src/components/ui/Divider";
import { Card } from "../../../src/components/ui/Card";

export function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => logout.mutate(),
      },
    ]);
  };

  return (
    <ScreenWrapper title="Profile">
      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="items-center py-6 bg-white dark:bg-surface">
          <Avatar
            name={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`}
            size={80}
          />
          <Text className="text-xl font-sans-bold text-gray-900 dark:text-gray-100 mt-3">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-sm font-sans text-muted mt-1">
            {user?.email}
          </Text>
          <RoleBadge role={user?.role ?? "STUDENT"} />
        </View>

        <Divider />

        {/* Info */}
        <Card className="m-4">
          {user?.phone && (
            <InfoRow icon="call-outline" label="Phone" value={user.phone} />
          )}
          <InfoRow
            icon="shield-checkmark-outline"
            label="Role"
            value={user?.role ?? ""}
          />
          {user?.schoolName && (
            <InfoRow
              icon="school-outline"
              label="School"
              value={user.schoolName}
            />
          )}
        </Card>

        {/* Menu */}
        <View className="px-4 gap-2">
          <MenuItem
            icon="key-outline"
            label="Change Password"
            onPress={() => router.push("/(tabs)/profile/change-password")}
          />
          <MenuItem
            icon="settings-outline"
            label="App Settings"
            onPress={() => router.push("/(tabs)/profile/app-settings")}
          />
          <MenuItem
            icon="log-out-outline"
            label="Logout"
            onPress={handleLogout}
            danger
          />
        </View>

        <View className="h-8" />
      </ScrollView>
    </ScreenWrapper>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-800">
      <Ionicons name={icon} size={18} color="#6b7280" />
      <Text className="text-sm font-sans text-muted ml-3 w-20">{label}</Text>
      <Text className="text-sm font-sans-medium text-gray-900 dark:text-gray-100 flex-1">
        {value}
      </Text>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-white dark:bg-surface p-4 rounded-xl"
    >
      <Ionicons name={icon} size={20} color={danger ? "#ef4444" : "#6b7280"} />
      <Text
        className={`text-base font-sans-medium ml-3 flex-1 ${
          danger ? "text-danger" : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
    </Pressable>
  );
}

export default ProfileScreen;
