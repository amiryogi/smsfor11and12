import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePayment } from "../../../../src/hooks/useFinance";
import { ScreenWrapper } from "../../../../src/components/layout/ScreenWrapper";
import { Card } from "../../../../src/components/ui/Card";
import { Divider } from "../../../../src/components/ui/Divider";
import { LoadingScreen } from "../../../../src/components/ui/LoadingScreen";
import { formatNPR, formatDate } from "../../../../src/utils/format";

export function PaymentDetailScreen() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const { data, isLoading } = usePayment(paymentId!);

  if (isLoading) return <LoadingScreen message="Loading receipt..." />;

  const payment = data?.data;

  return (
    <ScreenWrapper title="Payment Receipt" showBack>
      <ScrollView className="flex-1">
        {/* Receipt Card */}
        <Card className="m-4">
          {/* Header */}
          <View className="items-center pb-4 border-b border-gray-100 dark:border-gray-800">
            <View className="w-14 h-14 rounded-full bg-success/20 items-center justify-center mb-3">
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
            </View>
            <Text className="text-xl font-sans-bold text-gray-900 dark:text-gray-100">
              {formatNPR(payment?.amount ?? 0)}
            </Text>
            <Text className="text-sm font-sans text-success mt-1">
              Payment Successful
            </Text>
          </View>

          {/* Details */}
          <View className="pt-4 gap-3">
            {payment?.receiptNo && (
              <DetailRow label="Receipt No" value={payment.receiptNo} />
            )}
            <DetailRow label="Date" value={formatDate(payment?.paidAt ?? "")} />
            <DetailRow
              label="Method"
              value={payment?.method?.replace("_", " ") ?? ""}
            />
            {payment?.referenceNo && (
              <DetailRow label="Reference" value={payment.referenceNo} />
            )}
            {payment?.invoiceNo && (
              <DetailRow label="Invoice" value={payment.invoiceNo} />
            )}
            {payment?.studentName && (
              <DetailRow label="Student" value={payment.studentName} />
            )}
          </View>

          <Divider className="my-4" />

          {payment?.remarks && (
            <View>
              <Text className="text-xs font-sans text-muted mb-1">Remarks</Text>
              <Text className="text-sm font-sans text-gray-900 dark:text-gray-100">
                {payment.remarks}
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm font-sans text-muted">{label}</Text>
      <Text className="text-sm font-sans-medium text-gray-900 dark:text-gray-100">
        {value}
      </Text>
    </View>
  );
}

export default PaymentDetailScreen;
