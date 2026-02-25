import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { useStudentSummary, useFinanceSummary } from "./useReports";

export { useStudentSummary, useFinanceSummary };

export function useDashboardData() {
  const students = useStudentSummary();
  const finance = useFinanceSummary();

  return {
    isRefetching: students.isRefetching || finance.isRefetching,
    refetch: async () => {
      await Promise.all([students.refetch(), finance.refetch()]);
    },
  };
}
