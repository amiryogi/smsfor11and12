import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { formatNPR } from "../../utils/format";

interface RevenueChartProps {
  data: Array<{ month: string; amount: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) return null;

  const screenWidth = Dimensions.get("window").width - 32;

  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
      <Text className="text-base font-sans-semibold text-gray-900 dark:text-gray-100 mb-3">
        Monthly Revenue
      </Text>
      <LineChart
        data={{
          labels: data.map((d) => d.month),
          datasets: [{ data: data.map((d) => d.amount) }],
        }}
        width={screenWidth - 32}
        height={200}
        yAxisLabel="रु."
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: "#FFFFFF",
          backgroundGradientFrom: "#FFFFFF",
          backgroundGradientTo: "#FFFFFF",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          labelColor: () => "#6B7280",
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#2563EB",
          },
        }}
        bezier
        style={{ borderRadius: 12 }}
      />
    </View>
  );
}
