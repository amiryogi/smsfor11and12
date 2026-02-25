import { memo } from "react";
import { View, Text } from "react-native";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { formatNPR, formatDate } from "../../utils/format";
import type { Invoice } from "../../types/finance.types";

interface InvoiceRowProps {
  invoice: Invoice;
  onPress: () => void;
}

export const InvoiceRow = memo(function InvoiceRow({
  invoice,
  onPress,
}: InvoiceRowProps) {
  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-sans-semibold text-gray-900 dark:text-gray-100">
            {invoice.studentName}
          </Text>
          <Text className="text-sm font-sans text-muted mt-0.5">
            {invoice.academicYearName}
            {invoice.dueDate ? ` • Due: ${formatDate(invoice.dueDate)}` : ""}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-base font-sans-bold text-gray-900 dark:text-gray-100">
            {formatNPR(invoice.totalAmount)}
          </Text>
          <Badge
            label={invoice.status}
            status={invoice.status}
            className="mt-1"
          />
        </View>
      </View>

      {/* Balance bar */}
      {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
        <View className="mt-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs font-sans text-muted">
              Paid: {formatNPR(invoice.paidAmount)}
            </Text>
            <Text className="text-xs font-sans text-danger">
              Due: {formatNPR(invoice.balanceDue)}
            </Text>
          </View>
          <View className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <View
              className="h-full bg-green-500 rounded-full"
              style={{
                width: `${Math.min((invoice.paidAmount / invoice.totalAmount) * 100, 100)}%`,
              }}
            />
          </View>
        </View>
      )}
    </Card>
  );
});
