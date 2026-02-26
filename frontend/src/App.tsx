import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { AuthGuard } from "./components/auth/AuthGuard";
import { DashboardLayout } from "./components/layout/DashboardLayout";

// Pages
import { LoginPage } from "./pages/login/LoginPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { StudentsListPage } from "./pages/students/StudentsListPage";
import { StudentCreatePage } from "./pages/students/StudentCreatePage";
import { StudentDetailPage } from "./pages/students/StudentDetailPage";
import { StudentEditPage } from "./pages/students/StudentEditPage";
import { AcademicYearsPage } from "./pages/academic/AcademicYearsPage";
import { GradesPage } from "./pages/academic/GradesPage";
import { SubjectsPage } from "./pages/academic/SubjectsPage";
import { ExamsListPage } from "./pages/exams/ExamsListPage";
import { ExamDetailPage } from "./pages/exams/ExamDetailPage";
import { MarksEntryPage } from "./pages/exams/MarksEntryPage";
import { ExamResultsPage } from "./pages/exams/ExamResultsPage";
import { FeeStructuresPage } from "./pages/finance/FeeStructuresPage";
import { InvoicesPage } from "./pages/finance/InvoicesPage";
import { InvoiceDetailPage } from "./pages/finance/InvoiceDetailPage";
import { PaymentsPage } from "./pages/finance/PaymentsPage";
import { PaymentCreatePage } from "./pages/finance/PaymentCreatePage";
import { ExamReportPage } from "./pages/reports/ExamReportPage";
import { FinancialLedgerPage } from "./pages/reports/FinancialLedgerPage";
import { OutstandingPage } from "./pages/reports/OutstandingPage";
import { UsersPage } from "./pages/users/UsersPage";
import { SchoolSettingsPage } from "./pages/settings/SchoolSettingsPage";
import { NotificationsPage } from "./pages/notifications/NotificationsPage";
import { ProfilePage } from "./pages/profile/ProfilePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      // Students
      { path: "students", element: <StudentsListPage /> },
      { path: "students/new", element: <StudentCreatePage /> },
      { path: "students/:id", element: <StudentDetailPage /> },
      { path: "students/:id/edit", element: <StudentEditPage /> },
      // Academic
      { path: "academic/years", element: <AcademicYearsPage /> },
      { path: "academic/grades", element: <GradesPage /> },
      { path: "academic/subjects", element: <SubjectsPage /> },
      // Exams
      { path: "exams", element: <ExamsListPage /> },
      { path: "exams/:id", element: <ExamDetailPage /> },
      { path: "exams/:id/marks-entry", element: <MarksEntryPage /> },
      { path: "exams/:id/results", element: <ExamResultsPage /> },
      { path: "exams/:examId/report", element: <ExamReportPage /> },
      // Finance
      { path: "finance/fee-structures", element: <FeeStructuresPage /> },
      { path: "finance/invoices", element: <InvoicesPage /> },
      { path: "finance/invoices/:id", element: <InvoiceDetailPage /> },
      { path: "finance/payments", element: <PaymentsPage /> },
      { path: "finance/payments/new", element: <PaymentCreatePage /> },
      // Reports
      { path: "reports/finance/ledger", element: <FinancialLedgerPage /> },
      { path: "reports/finance/outstanding", element: <OutstandingPage /> },
      { path: "reports/exam/:examId", element: <ExamReportPage /> },
      // Admin
      { path: "users", element: <UsersPage /> },
      { path: "settings", element: <SchoolSettingsPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
