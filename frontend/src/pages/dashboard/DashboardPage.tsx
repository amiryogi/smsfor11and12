import { useStudentSummaryReport } from "../../hooks/useReports";
import { useAuthStore } from "../../stores/auth.store";
import { StatCard } from "../../components/ui/StatCard";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { PageHeader } from "../../components/layout/PageHeader";

export function DashboardPage() {
  const { user } = useAuthStore();
  const {
    data: summary,
    isLoading,
    isError,
    refetch,
  } = useStudentSummaryReport();

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.firstName ?? "User"}`}
        description="School Management Dashboard"
      />
      {isLoading && <LoadingSpinner />}
      {isError && (
        <ErrorState
          message="Failed to load dashboard data"
          onRetry={() => refetch()}
        />
      )}
      {summary && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Students" value={summary.data.totalActive} />
          <StatCard title="Graduated" value={summary.data.totalGraduated} />
          <StatCard title="Dropout" value={summary.data.totalDropout} />
          <StatCard title="Transferred" value={summary.data.totalTransferred} />
        </div>
      )}
      {summary && summary.data.byGrade && summary.data.byGrade.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Students by Grade
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summary.data.byGrade.map((g) => (
              <div key={g.gradeId} className="card">
                <p className="text-sm font-medium text-gray-500">
                  {g.gradeName}
                </p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {g.count}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
