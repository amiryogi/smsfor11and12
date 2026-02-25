import { Stack } from "expo-router";

export default function FinanceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[invoiceId]" />
      <Stack.Screen
        name="payment/[paymentId]"
        options={{ presentation: "modal" }}
      />
    </Stack>
  );
}
