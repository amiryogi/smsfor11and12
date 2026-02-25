import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/stores/auth.store";

type TabConfig = {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  roles: string[];
};

const TAB_CONFIG: TabConfig[] = [
  {
    name: "index",
    title: "Home",
    icon: "home",
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "TEACHER",
      "PARENT",
      "STUDENT",
      "ACCOUNTANT",
    ],
  },
  {
    name: "academics",
    title: "Academics",
    icon: "school",
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER", "PARENT", "STUDENT"],
  },
  {
    name: "students",
    title: "Students",
    icon: "people",
    roles: ["SUPER_ADMIN", "ADMIN", "TEACHER"],
  },
  {
    name: "finance",
    title: "Finance",
    icon: "wallet",
    roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "PARENT"],
  },
  {
    name: "notifications",
    title: "Alerts",
    icon: "notifications",
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "TEACHER",
      "PARENT",
      "STUDENT",
      "ACCOUNTANT",
    ],
  },
  {
    name: "profile",
    title: "Profile",
    icon: "person-circle",
    roles: [
      "SUPER_ADMIN",
      "ADMIN",
      "TEACHER",
      "PARENT",
      "STUDENT",
      "ACCOUNTANT",
    ],
  },
];

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1E40AF",
        tabBarInactiveTintColor: "#9CA3AF",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingBottom: 4,
          height: 60,
        },
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} size={size} color={color} />
            ),
            href: tab.roles.includes(user.role) ? undefined : null,
          }}
        />
      ))}
    </Tabs>
  );
}
