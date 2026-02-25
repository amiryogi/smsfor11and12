import { Stack } from "expo-router";

export default function AcademicsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: "#1E40AF",
        headerTitleStyle: { fontFamily: "Inter_600SemiBold" },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Exams & Results" }} />
      <Stack.Screen name="[examId]" options={{ title: "Exam Details" }} />
      <Stack.Screen
        name="marks-entry/[examId]"
        options={{ title: "Enter Marks" }}
      />
    </Stack>
  );
}
