import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useInvoice } from "../../../src/hooks/useFinance";
import { ScreenWrapper } from "../../../src/components/layout/ScreenWrapper";
import { Card } from "../../../src/components/ui/Card";
import { Badge } from "../../../src/components/ui/Badge";
import { Divider } from "../../../src/components/ui/Divider";
import { LoadingScreen } from "../../../src/components/ui/LoadingScreen";
import { formatNPR, formatDate } from "../../../src/utils/format";
import type { InvoiceLineItem } from "../../../src/types/finance.types";

export function InvoiceDetailScreen() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const { data, isLoading, refetch, isRefetching } = useInvoice(invoiceId!);

  if (isLoading) return <LoadingScreen message="Loading invoice..." />;

  const invoice = data?.data;

  const totalPaid = (invoice?.totalAmount ?? 0) - (invoice?.balanceAmount ?? 0);

  return (
    <ScreenWrapper title={`Invoice ${invoice?.invoiceNo ?? ""}`} showBack>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View className="bg-white dark:bg-surface p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-lg font-sans-bold text-gray-900 dark:text-gray-100">
                {invoice?.invoiceNo}
              </Text>
              <Text className="text-sm font-sans text-muted mt-1">
                {invoice?.studentName}
              </Text>
            </View>
            <Badge
              label={invoice?.status ?? "PENDING"}
              status={invoice?.status ?? "PENDING"}
            />
          </View>

          <View className="flex-row justify-between mt-4">
            <View>
              <Text className="text-xs font-sans text-muted">Issue Date</Text>
              <Text className="text-sm font-sans-medium text-gray-900 dark:text-gray-100">
                {formatDate(invoice?.issueDate ?? "")}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs font-sans text-muted">Due Date</Text>
              <Text className="text-sm font-sans-medium text-gray-900 dark:text-gray-100">
                {formatDate(invoice?.dueDate ?? "")}
              </Text>
            </View>
          </View>
        </View>

        <Divider />

        {/* Line Items */}
        <View className="p-4">
          <Text className="text-base font-sans-semibold text-gray-900 dark:text-gray-100 mb-3">
            Line Items
          </Text>
          {invoice?.lineItems?.map((item: InvoiceLineItem) => (
            <View
              key={item.id}
              className="flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-800"
            >
              <View className="flex-1 mr-4">
                <Text className="text-sm font-sans text-gray-900 dark:text-gray-100">
                  {item.description}
                </Text>
                {item.quantity > 1 && (
                  <Text className="text-xs font-sans text-muted">
                    {item.quantity} × {formatNPR(item.unitPrice)}
                  </Text>
                )}
              </View>
              <Text className="text-sm font-sans-medium text-gray-900 dark:text-gray-100">
                {formatNPR(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        <Divider className="mx-4" />

        {/* Summary */}
        <View className="p-4 gap-2">
          <View className="flex-row justify-between">
            <Text className="text-sm font-sans text-muted">Total Amount</Text>
            <Text className="text-base font-sans-bold text-gray-900 dark:text-gray-100">
              {formatNPR(invoice?.totalAmount ?? 0)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm font-sans text-muted">Paid</Text>
            <Text className="text-base font-sans-semibold text-success">
              {formatNPR(totalPaid)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm font-sans text-muted">Balance Due</Text>
            <Text className="text-base font-sans-bold text-danger">
              {formatNPR(invoice?.balanceAmount ?? 0)}
            </Text>
          </View>
        </View>

        {/* Payment Progress */}
        <View className="px-4 pb-4">
          <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <View
              className="h-full bg-success rounded-full"
              style={{
                width: `${
                  invoice?.totalAmount
                    ? Math.round((totalPaid / invoice.totalAmount) * 100)
                    : 0
                }%` as unknown as number,
              }}
            />
          </View>
          <Text className="text-xs font-sans text-muted text-center mt-1">
            {invoice?.totalAmount
              ? ((totalPaid / invoice.totalAmount) * 100).toFixed(0)
              : 0}
            % Paid
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

export default InvoiceDetailScreen;
