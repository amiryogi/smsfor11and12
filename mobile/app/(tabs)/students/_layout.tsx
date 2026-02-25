import { Stack } from "expo-router";

export default function StudentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: "#1E40AF",
        headerTitleStyle: { fontFamily: "Inter_600SemiBold" },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Students" }} />
      <Stack.Screen name="[studentId]" options={{ title: "Student Profile" }} />
      <Stack.Screen name="my-children" options={{ title: "My Children" }} />
    </Stack>
  );
}
