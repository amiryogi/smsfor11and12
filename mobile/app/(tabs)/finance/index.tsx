import { useState } from "react";
import { View, Text, FlatList, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useInvoices, usePayments } from "../../../src/hooks/useFinance";
import { useAuthStore } from "../../../src/stores/auth.store";
import { ScreenWrapper } from "../../../src/components/layout/ScreenWrapper";
import { InvoiceRow } from "../../../src/components/domain/InvoiceRow";
import { LoadingScreen } from "../../../src/components/ui/LoadingScreen";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { Card } from "../../../src/components/ui/Card";
import { Badge } from "../../../src/components/ui/Badge";
import { formatNPR, formatDate } from "../../../src/utils/format";
import { isAdminRole } from "../../../src/constants/roles";
import type { Invoice } from "../../../src/types/finance.types";

type Tab = "invoices" | "payments";

export function FinanceIndexScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const showTabs = isAdminRole(user?.role ?? "") || user?.role === "ACCOUNTANT";
  const [activeTab, setActiveTab] = useState<Tab>("invoices");

  const {
    data: invoicesData,
    isLoading: loadingInvoices,
    refetch: refetchInvoices,
    isRefetching: refetchingInvoices,
  } = useInvoices();

  const {
    data: paymentsData,
    isLoading: loadingPayments,
    refetch: refetchPayments,
    isRefetching: refetchingPayments,
  } = usePayments();

  const isLoading =
    activeTab === "invoices" ? loadingInvoices : loadingPayments;
  if (isLoading) return <LoadingScreen message="Loading finance data..." />;

  const invoices: Invoice[] = invoicesData?.data ?? [];
  const payments = paymentsData?.data ?? [];

  return (
    <ScreenWrapper title="Finance">
      {/* Tab Switcher */}
      {showTabs && (
        <View className="flex-row bg-white dark:bg-surface border-b border-gray-200 dark:border-gray-700">
          <TabButton
            label="Invoices"
            active={activeTab === "invoices"}
            onPress={() => setActiveTab("invoices")}
          />
          <TabButton
            label="Payments"
            active={activeTab === "payments"}
            onPress={() => setActiveTab("payments")}
          />
        </View>
      )}

      {activeTab === "invoices" ? (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4"
          refreshControl={
            <RefreshControl
              refreshing={refetchingInvoices}
              onRefresh={refetchInvoices}
            />
          }
          renderItem={({ item }) => (
            <InvoiceRow
              invoice={item}
              onPress={() => router.push(`/(tabs)/finance/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState icon="receipt-outline" message="No invoices found" />
          }
        />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4"
          refreshControl={
            <RefreshControl
              refreshing={refetchingPayments}
              onRefresh={refetchPayments}
            />
          }
          renderItem={({ item }) => (
            <Card
              className="mb-2"
              onPress={() => router.push(`/(tabs)/finance/payment/${item.id}`)}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-sm font-sans-medium text-gray-900 dark:text-gray-100">
                    {item.receiptNo ?? `Payment #${item.id.slice(0, 8)}`}
                  </Text>
                  <Text className="text-xs font-sans text-muted mt-1">
                    {formatDate(item.paidAt)} • {item.method}
                  </Text>
                </View>
                <Text className="text-sm font-sans-bold text-success">
                  {formatNPR(item.amount)}
                </Text>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState icon="wallet-outline" message="No payments found" />
          }
        />
      )}
    </ScreenWrapper>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center py-3">
      <Text
        className={`text-sm font-sans-semibold ${
          active ? "text-primary-600 dark:text-primary-400" : "text-muted"
        }`}
      >
        {label}
      </Text>
      {active && (
        <View className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full" />
      )}
    </Pressable>
  );
}

export default FinanceIndexScreen;
