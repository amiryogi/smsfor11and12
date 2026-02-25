import { ScrollView, RefreshControl } from "react-native";
import { useAuthStore } from "../../src/stores/auth.store";
import { useDashboardData } from "../../src/hooks/useDashboard";
import { ScreenWrapper } from "../../src/components/layout/ScreenWrapper";
import { AdminDashboard } from "../../src/components/domain/AdminDashboard";
import { TeacherDashboard } from "../../src/components/domain/TeacherDashboard";
import { ParentDashboard } from "../../src/components/domain/ParentDashboard";
import { StudentDashboard } from "../../src/components/domain/StudentDashboard";
import { AccountantDashboard } from "../../src/components/domain/AccountantDashboard";

const DASHBOARD_MAP: Record<string, React.ComponentType> = {
  SUPER_ADMIN: AdminDashboard,
  ADMIN: AdminDashboard,
  TEACHER: TeacherDashboard,
  ACCOUNTANT: AccountantDashboard,
  PARENT: ParentDashboard,
  STUDENT: StudentDashboard,
};

export function HomeScreen() {
  const role = useAuthStore((s) => s.user?.role) ?? "STUDENT";
  const { refetch, isRefetching } = useDashboardData();
  const DashboardComponent = DASHBOARD_MAP[role] ?? StudentDashboard;

  return (
    <ScreenWrapper title="Dashboard">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <DashboardComponent />
      </ScrollView>
    </ScreenWrapper>
  );
}

export default HomeScreen;
