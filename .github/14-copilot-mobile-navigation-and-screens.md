# Context: Mobile Navigation & Screen Specifications

## Domain: NEB +2 School Management ERP — React Native Expo

This document defines every screen in the mobile app, the navigation hierarchy, role-based access rules, and screen component patterns. The agent MUST implement screens exactly as specified here.

---

### 🚨 Navigation Rules

1. **Expo Router file-based routing.** Screen files inside `app/` directory define routes automatically. DO NOT use React Navigation directly.
2. **Role-based tab visibility.** The tab bar MUST only show tabs the current user's role has access to (see Section 2).
3. **Auth guard.** The `(tabs)` group must redirect to `(auth)/login` if no valid JWT exists in secure storage.
4. **Deep linking.** Each screen must be deep-linkable via the `nebschoolerp://` URL scheme.
5. **Screen headers.** Use Expo Router's `<Stack.Screen options={{ title: '...' }} />` for screen headers. NEVER build custom headers unless design requires it.
6. **Pull-to-refresh.** ALL list screens MUST support pull-to-refresh using TanStack Query's `refetch()`.

---

### 🗂 1. Navigation Architecture

```
Root Stack (app/_layout.tsx)
├── (auth)/                          # Auth Stack — shown when NOT authenticated
│   ├── login                        # Email + password login
│   └── forgot-password              # Password reset request
│
├── (tabs)/                          # Tab Navigator — shown when authenticated
│   ├── _layout.tsx                  # Tab bar with role-based visibility
│   │
│   ├── index                        # 🏠 Home / Dashboard
│   │
│   ├── academics/                   # 📝 Academics Stack
│   │   ├── index                    # Exams list / Results overview
│   │   ├── [examId]                 # Exam detail with subject results
│   │   └── marks-entry/[examId]     # Marks entry form (Teacher only)
│   │
│   ├── students/                    # 🎓 Students Stack
│   │   ├── index                    # Student list (Admin/Teacher)
│   │   ├── [studentId]              # Student profile + enrollments
│   │   └── my-children              # Parent's children list (Parent only)
│   │
│   ├── finance/                     # 💰 Finance Stack
│   │   ├── index                    # Invoices + Payments list
│   │   ├── [invoiceId]              # Invoice detail with line items
│   │   └── payment/[paymentId]      # Payment receipt detail
│   │
│   ├── notifications                # 🔔 Notifications list
│   │
│   └── profile                      # 👤 Profile & Settings
│       ├── index                    # Profile overview
│       ├── change-password          # Change password form
│       └── app-settings             # Theme, biometrics, notification prefs
│
└── +not-found                       # 404 fallback screen
```

---

### 🎛 2. Role-Based Tab Visibility

```tsx
// app/(tabs)/_layout.tsx
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@stores/auth.store";

type TabConfig = {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  roles: string[]; // Which roles can see this tab
};

const TAB_CONFIG: TabConfig[] = [
  {
    name: "index",
    title: "Home",
    icon: "home",
    roles: ["ADMIN", "TEACHER", "PARENT", "STUDENT", "ACCOUNTANT"],
  },
  {
    name: "academics",
    title: "Academics",
    icon: "school",
    roles: ["ADMIN", "TEACHER", "PARENT", "STUDENT"],
  },
  {
    name: "students",
    title: "Students",
    icon: "people",
    roles: ["ADMIN", "TEACHER"],
  },
  {
    name: "finance",
    title: "Finance",
    icon: "wallet",
    roles: ["ADMIN", "ACCOUNTANT", "PARENT"],
  },
  {
    name: "notifications",
    title: "Alerts",
    icon: "notifications",
    roles: ["ADMIN", "TEACHER", "PARENT", "STUDENT", "ACCOUNTANT"],
  },
  {
    name: "profile",
    title: "Profile",
    icon: "person-circle",
    roles: ["ADMIN", "TEACHER", "PARENT", "STUDENT", "ACCOUNTANT"],
  },
];

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1E40AF",
        tabBarInactiveTintColor: "#9CA3AF",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingBottom: 4,
          height: 60,
        },
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} size={size} color={color} />
            ),
            // Hide tab if user's role is not in the allowed roles
            href: tab.roles.includes(user.role) ? undefined : null,
          }}
        />
      ))}
    </Tabs>
  );
}
```

**Rule:** The `href: null` approach hides tabs completely. DO NOT conditionally render `<Tabs.Screen>` — that breaks Expo Router's static route generation.

---

### 📱 3. Screen Specifications

#### 3.1 Auth Screens

**Login Screen** — `app/(auth)/login.tsx`

| Property   | Value                                                                 |
| ---------- | --------------------------------------------------------------------- |
| Fields     | Email (text input), Password (secure input)                           |
| Actions    | Login button, "Forgot Password?" link                                 |
| Validation | Zod: email format required, password min 8 chars                      |
| On Success | Store tokens in SecureStore → navigate to `(tabs)/`                   |
| On Error   | Show error message from API envelope (`error.message`)                |
| Extra      | Optional biometric unlock if previously logged in (check SecureStore) |

```tsx
// app/(auth)/login.tsx
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@hooks/useAuth";
import { FormInput } from "@components/forms/FormInput";
import { Button } from "@components/ui/Button";

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const router = useRouter();
  const loginMutation = useLogin();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data, {
      onSuccess: () => router.replace("/(tabs)"),
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-sans-bold text-primary-800 text-center mb-2">
          NEB School ERP
        </Text>
        <Text className="text-base font-sans text-muted text-center mb-8">
          Sign in to your account
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Email"
              placeholder="you@school.np"
              keyboardType="email-address"
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <FormInput
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
            />
          )}
        />

        <Button
          title="Sign In"
          onPress={handleSubmit(onSubmit)}
          loading={loginMutation.isPending}
          className="mt-4"
        />

        <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
          <Text className="text-primary-600 text-center mt-4 font-sans-medium">
            Forgot Password?
          </Text>
        </Pressable>

        {loginMutation.isError && (
          <Text className="text-danger text-center mt-4 font-sans">
            {loginMutation.error?.message || "Login failed. Please try again."}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

export default LoginScreen;
```

---

#### 3.2 Dashboard / Home Screen

**Home Screen** — `app/(tabs)/index.tsx`

The dashboard is **role-adaptive** — it shows different widgets based on the user's role.

| Role       | Dashboard Widgets                                                               |
| ---------- | ------------------------------------------------------------------------------- |
| ADMIN      | Student count, Revenue summary (NPR), Pending invoices, Recent activities chart |
| TEACHER    | My classes, Upcoming exams needing marks entry, Recent notifications            |
| ACCOUNTANT | Today's collections (NPR), Outstanding balances, Recent payments                |
| PARENT     | Children's latest results, Pending invoices for children, Recent notifications  |
| STUDENT    | My latest results, My pending invoices, Exam schedule                           |

```tsx
// app/(tabs)/index.tsx
import { ScrollView, RefreshControl } from "react-native";
import { useAuthStore } from "@stores/auth.store";
import { useDashboardData } from "@hooks/useReports";
import { ScreenWrapper } from "@components/layout/ScreenWrapper";
import { AdminDashboard } from "@components/domain/AdminDashboard";
import { TeacherDashboard } from "@components/domain/TeacherDashboard";
import { ParentDashboard } from "@components/domain/ParentDashboard";
import { StudentDashboard } from "@components/domain/StudentDashboard";
import { AccountantDashboard } from "@components/domain/AccountantDashboard";

const DASHBOARD_MAP: Record<string, React.ComponentType> = {
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
```

**Admin Dashboard Widget Example:**

```tsx
// src/components/domain/AdminDashboard.tsx
import { View, Text } from "react-native";
import { useStudentSummary, useFinanceSummary } from "@hooks/useReports";
import { StatCard } from "@components/ui/StatCard";
import { RevenueChart } from "@components/domain/RevenueChart";
import { formatNPR } from "@utils/format";

export function AdminDashboard() {
  const { data: studentStats } = useStudentSummary();
  const { data: financeStats } = useFinanceSummary();

  return (
    <View className="p-4 gap-4">
      <Text className="text-xl font-sans-bold text-gray-900">
        School Overview
      </Text>

      <View className="flex-row flex-wrap gap-3">
        <StatCard
          title="Active Students"
          value={studentStats?.data.activeCount ?? 0}
          icon="people"
          color="primary"
        />
        <StatCard
          title="Revenue (This Month)"
          value={formatNPR(financeStats?.data.monthlyRevenue ?? 0)}
          icon="wallet"
          color="success"
        />
        <StatCard
          title="Pending Invoices"
          value={financeStats?.data.pendingInvoiceCount ?? 0}
          icon="alert-circle"
          color="warning"
        />
        <StatCard
          title="Outstanding"
          value={formatNPR(financeStats?.data.totalOutstanding ?? 0)}
          icon="trending-down"
          color="danger"
        />
      </View>

      <RevenueChart data={financeStats?.data.monthlyBreakdown ?? []} />
    </View>
  );
}
```

---

#### 3.3 Academics Screens

**Exams List** — `app/(tabs)/academics/index.tsx`

| Property     | Value                                                                         |
| ------------ | ----------------------------------------------------------------------------- |
| Data Source  | `GET /exams` (filtered by user context)                                       |
| Display      | FlatList of exam cards grouped by academic year                               |
| Parent View  | Shows only PUBLISHED exams for enrolled children                              |
| Student View | Shows only PUBLISHED exams for their enrollment                               |
| Teacher View | Shows all exams, with MARKS_ENTRY badge for actionable exams                  |
| Admin View   | Shows all exams with status badges (DRAFT, MARKS_ENTRY, FINALIZED, PUBLISHED) |
| Actions      | Tap → navigate to exam detail                                                 |

```tsx
// app/(tabs)/academics/index.tsx
import { FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useExams } from "@hooks/useExams";
import { ScreenWrapper } from "@components/layout/ScreenWrapper";
import { ExamCard } from "@components/domain/ExamCard";
import { EmptyState } from "@components/ui/EmptyState";

export function ExamsListScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useExams();

  return (
    <ScreenWrapper title="Exams & Results">
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExamCard
            exam={item}
            onPress={() => router.push(`/(tabs)/academics/${item.id}`)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState message="No exams found" icon="school" />
          ) : null
        }
        contentContainerClassName="p-4 gap-3"
      />
    </ScreenWrapper>
  );
}

export default ExamsListScreen;
```

**Exam Detail / Results** — `app/(tabs)/academics/[examId].tsx`

| Property     | Value                                                                                 |
| ------------ | ------------------------------------------------------------------------------------- |
| Data Source  | `GET /exams/:examId` + `GET /exams/:examId/results/student/:studentId`                |
| Parent View  | Shows per-child results with subject breakdown, NEB grades, GPA                       |
| Student View | Shows own results: subject list with theory/practical marks, grades, final GPA        |
| Teacher View | Shows class-wide summary, option to enter marks if status is MARKS_ENTRY              |
| Admin View   | Full exam detail with status, ability to view any student's results                   |
| Actions      | Download marksheet PDF (via `GET /reports/exam/:examId/student/:studentId/marksheet`) |

```tsx
// app/(tabs)/academics/[examId].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, View, Text, RefreshControl } from "react-native";
import { useExam, useStudentExamResults } from "@hooks/useExams";
import { useAuthStore } from "@stores/auth.store";
import { ScreenWrapper } from "@components/layout/ScreenWrapper";
import { SubjectResultRow } from "@components/domain/SubjectResultRow";
import { GradeBadge } from "@components/domain/GradeBadge";
import { Button } from "@components/ui/Button";

export function ExamDetailScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: exam, refetch, isRefetching } = useExam(examId!);
  const { data: results } = useStudentExamResults(examId!, user?.id);

  return (
    <ScreenWrapper title={exam?.data.name ?? "Exam Details"}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Exam info header */}
        <View className="p-4 bg-primary-50 border-b border-primary-100">
          <Text className="text-lg font-sans-semibold text-gray-900">
            {exam?.data.name}
          </Text>
          <Text className="text-sm font-sans text-muted mt-1">
            {exam?.data.examType} • {exam?.data.academicYear?.name}
          </Text>
          <GradeBadge status={exam?.data.status ?? "DRAFT"} />
        </View>

        {/* Subject Results */}
        <View className="p-4 gap-2">
          <Text className="text-base font-sans-semibold text-gray-800 mb-2">
            Subject Results
          </Text>
          {results?.data.map((result) => (
            <SubjectResultRow key={result.id} result={result} />
          ))}
        </View>

        {/* Download Marksheet */}
        {exam?.data.status === "PUBLISHED" && (
          <View className="px-4 pb-6">
            <Button
              title="Download Marksheet"
              variant="outline"
              icon="download"
              onPress={() => {
                // Triggers PDF generation job, opens in browser when ready
              }}
            />
          </View>
        )}

        {/* Marks Entry (Teacher only) */}
        {user?.role === "TEACHER" && exam?.data.status === "MARKS_ENTRY" && (
          <View className="px-4 pb-6">
            <Button
              title="Enter Marks"
              onPress={() =>
                router.push(`/(tabs)/academics/marks-entry/${examId}`)
              }
            />
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

export default ExamDetailScreen;
```

**Marks Entry** — `app/(tabs)/academics/marks-entry/[examId].tsx`

| Property    | Value                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Roles       | TEACHER, ADMIN only                                                    |
| Data Source | `GET /exams/:examId/results?gradeSubjectId=...`                        |
| Form        | List of students with theory + practical mark inputs per student       |
| Validation  | Marks >= 0, theory <= theoryFullMarks, practical <= practicalFullMarks |
| Submit      | `POST /exams/:examId/results/bulk` (ACID transaction on backend)       |
| On Success  | Invalidate exam results query, show success toast, navigate back       |

---

#### 3.4 Student Screens

**Students List** — `app/(tabs)/students/index.tsx` (Admin/Teacher only)

| Property    | Value                                                                     |
| ----------- | ------------------------------------------------------------------------- |
| Data Source | `GET /students?page=1&limit=20`                                           |
| Display     | FlatList with `StudentCard` (photo, name, registration no, grade, status) |
| Search      | Text search input filtering by name                                       |
| Filters     | Status (ACTIVE, GRADUATED, etc.), Grade                                   |
| Actions     | Tap → Student profile, FAB → Add student (Admin only)                     |
| Pagination  | Infinite scroll using TanStack Query `useInfiniteQuery`                   |

```tsx
// app/(tabs)/students/index.tsx
import { useState, useCallback } from "react";
import { FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useInfiniteStudents } from "@hooks/useStudents";
import { ScreenWrapper } from "@components/layout/ScreenWrapper";
import { StudentCard } from "@components/domain/StudentCard";
import { SearchBar } from "@components/ui/SearchBar";
import { EmptyState } from "@components/ui/EmptyState";
import { useAuthStore } from "@stores/auth.store";

export function StudentsListScreen() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const [search, setSearch] = useState("");

  const { data, fetchNextPage, hasNextPage, isLoading, refetch, isRefetching } =
    useInfiniteStudents({ search });

  const students = data?.pages.flatMap((page) => page.data) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  return (
    <ScreenWrapper title="Students">
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search by name..."
      />
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StudentCard
            student={item}
            onPress={() => router.push(`/(tabs)/students/${item.id}`)}
          />
        )}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState message="No students found" icon="people" />
          ) : null
        }
        contentContainerClassName="p-4 gap-3"
      />
    </ScreenWrapper>
  );
}

export default StudentsListScreen;
```

**Student Profile** — `app/(tabs)/students/[studentId].tsx`

| Property    | Value                                                                         |
| ----------- | ----------------------------------------------------------------------------- |
| Data Source | `GET /students/:id` + `GET /students/:id/enrollments`                         |
| Sections    | Profile header (photo, name, reg no), Enrollment history, Recent exam results |
| Parent View | Can only see their linked children (enforced by backend)                      |
| Actions     | Call/SMS parent, View invoices, View results per exam                         |

**My Children (Parent)** — `app/(tabs)/students/my-children.tsx`

| Property    | Value                                                               |
| ----------- | ------------------------------------------------------------------- |
| Roles       | PARENT only                                                         |
| Data Source | `GET /students?parentId=currentUserId` (derived from JWT)           |
| Display     | List of linked children with quick-action cards (results, invoices) |

---

#### 3.5 Finance Screens

**Finance Overview** — `app/(tabs)/finance/index.tsx`

| Property         | Value                                                                        |
| ---------------- | ---------------------------------------------------------------------------- |
| Admin/Accountant | Tabs: "Invoices" + "Payments". FlatList per tab.                             |
| Parent           | Shows invoices for their children only. Each with status badge (PAID/UNPAID) |
| Data Source      | `GET /finance/invoices` + `GET /finance/payments`                            |
| Actions          | Tap invoice → detail, Tap payment → receipt                                  |

**Invoice Detail** — `app/(tabs)/finance/[invoiceId].tsx`

| Property    | Value                                                                 |
| ----------- | --------------------------------------------------------------------- |
| Data Source | `GET /finance/invoices/:id`                                           |
| Display     | Student name, Academic year, Due date, Status badge                   |
| Line Items  | FeeType, Description, Amount (NPR) — rendered in a styled table       |
| Footer      | Total, Paid amount, Balance Due — all in NPR with `formatNPR()`       |
| Actions     | "Record Payment" button (Admin/Accountant only) → opens payment modal |

**Payment Receipt** — `app/(tabs)/finance/payment/[paymentId].tsx`

| Property    | Value                                                                    |
| ----------- | ------------------------------------------------------------------------ |
| Data Source | `GET /finance/payments/:id`                                              |
| Display     | Receipt-style layout: student, invoice ref, amount, method, date, ref no |
| Actions     | Share receipt (expo-sharing), Download PDF receipt (if available)        |

---

#### 3.6 Notifications Screen

**Notifications** — `app/(tabs)/notifications.tsx`

| Property      | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Data Source   | `GET /notifications?page=1&limit=30`                             |
| Display       | FlatList of notification items with icon, title, body, timestamp |
| Unread Style  | Unread items have `bg-primary-50` background                     |
| Actions       | Tap → Mark as read + deep link to relevant screen                |
| Header Action | "Mark All Read" button → `POST /notifications/mark-all-read`     |
| Real-time     | Listen to WebSocket events to prepend new notifications          |

```tsx
// app/(tabs)/notifications.tsx
import { FlatList, RefreshControl, Pressable, View, Text } from "react-native";
import { useRouter } from "expo-router";
import {
  useNotifications,
  useMarkAllRead,
  useMarkRead,
} from "@hooks/useNotifications";
import { ScreenWrapper } from "@components/layout/ScreenWrapper";
import { NotificationItem } from "@components/domain/NotificationItem";
import { EmptyState } from "@components/ui/EmptyState";

export function NotificationsScreen() {
  const router = useRouter();
  const { data, refetch, isRefetching } = useNotifications();
  const markAllRead = useMarkAllRead();
  const markRead = useMarkRead();

  const handlePress = (notification: any) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
    // Deep link based on notification type
    switch (notification.type) {
      case "EXAM_PUBLISHED":
        router.push(`/(tabs)/academics/${notification.metadata?.examId}`);
        break;
      case "PAYMENT_RECEIVED":
        router.push(
          `/(tabs)/finance/payment/${notification.metadata?.paymentId}`,
        );
        break;
      case "PDF_READY":
        // Open PDF download URL in browser
        break;
      default:
        break;
    }
  };

  return (
    <ScreenWrapper
      title="Notifications"
      headerRight={
        <Pressable onPress={() => markAllRead.mutate()}>
          <Text className="text-primary-600 font-sans-medium">
            Mark All Read
          </Text>
        </Pressable>
      }
    >
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handlePress(item)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState message="No notifications" icon="notifications-off" />
        }
        contentContainerClassName="gap-1"
      />
    </ScreenWrapper>
  );
}

export default NotificationsScreen;
```

---

#### 3.7 Profile & Settings Screen

**Profile** — `app/(tabs)/profile/index.tsx`

| Property    | Value                                                     |
| ----------- | --------------------------------------------------------- |
| Data Source | `GET /auth/me`                                            |
| Sections    | Avatar + name, Role badge, Email, Phone, School name      |
| Actions     | Change password, App settings (theme, biometrics), Logout |

```tsx
// app/(tabs)/profile/index.tsx — structure
export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const router = useRouter();

  return (
    <ScreenWrapper title="Profile">
      <ScrollView className="flex-1 p-4">
        {/* Avatar + Name */}
        <View className="items-center mb-6">
          <Avatar uri={user?.profilePicUrl} size={80} />
          <Text className="text-xl font-sans-bold mt-3">
            {user?.firstName} {user?.lastName}
          </Text>
          <RoleBadge role={user?.role ?? "STUDENT"} />
        </View>

        {/* Info rows */}
        <InfoRow icon="mail" label="Email" value={user?.email ?? ""} />
        <InfoRow icon="call" label="Phone" value={user?.phone ?? "Not set"} />

        {/* Actions */}
        <MenuButton
          icon="lock-closed"
          title="Change Password"
          onPress={() => router.push("/(tabs)/profile/change-password")}
        />
        <MenuButton
          icon="settings"
          title="App Settings"
          onPress={() => router.push("/(tabs)/profile/app-settings")}
        />
        <MenuButton
          icon="log-out"
          title="Logout"
          destructive
          onPress={() => {
            logout.mutate();
            router.replace("/(auth)/login");
          }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}
```

**Change Password** — `app/(tabs)/profile/change-password.tsx`

| Property   | Value                                                |
| ---------- | ---------------------------------------------------- |
| Fields     | Current password, New password, Confirm new password |
| Validation | Zod: min 8 chars, new !== current, confirm === new   |
| Submit     | `PATCH /auth/change-password`                        |
| On Success | Show success toast, navigate back                    |

**App Settings** — `app/(tabs)/profile/app-settings.tsx`

| Property   | Value                                                             |
| ---------- | ----------------------------------------------------------------- |
| Options    | Dark mode toggle, Biometric lock toggle, Push notification toggle |
| Storage    | MMKV (non-sensitive preferences)                                  |
| Biometrics | If enabled, prompt on app launch via `expo-local-authentication`  |

---

### 🔄 4. Shared Navigation Patterns

**Infinite Scroll Pattern (for all list screens):**

```typescript
// src/hooks/useStudents.ts — infinite query pattern
import { useInfiniteQuery } from "@tanstack/react-query";
import { studentsApi } from "@api/students.api";

export function useInfiniteStudents(filters: { search?: string }) {
  return useInfiniteQuery({
    queryKey: ["students", "infinite", filters],
    queryFn: ({ pageParam = 1 }) =>
      studentsApi.list({ ...filters, page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}
```

**Screen Transition Pattern:**

```tsx
// All stack navigators inside tabs use this pattern
// app/(tabs)/academics/_layout.tsx
import { Stack } from "expo-router";

export default function AcademicsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: "#1E40AF",
        headerTitleStyle: { fontFamily: "Inter_600SemiBold" },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Exams & Results" }} />
      <Stack.Screen name="[examId]" options={{ title: "Exam Details" }} />
      <Stack.Screen
        name="marks-entry/[examId]"
        options={{ title: "Enter Marks" }}
      />
    </Stack>
  );
}
```

---

### 📋 5. Complete Screen Inventory

| #   | Screen                | Route                                   | Roles                           |
| --- | --------------------- | --------------------------------------- | ------------------------------- |
| 1   | Login                 | `(auth)/login`                          | Public                          |
| 2   | Forgot Password       | `(auth)/forgot-password`                | Public                          |
| 3   | Dashboard / Home      | `(tabs)/index`                          | All authenticated               |
| 4   | Exams List            | `(tabs)/academics/index`                | Admin, Teacher, Parent, Student |
| 5   | Exam Detail / Results | `(tabs)/academics/[examId]`             | Admin, Teacher, Parent, Student |
| 6   | Marks Entry           | `(tabs)/academics/marks-entry/[examId]` | Admin, Teacher                  |
| 7   | Students List         | `(tabs)/students/index`                 | Admin, Teacher                  |
| 8   | Student Profile       | `(tabs)/students/[studentId]`           | Admin, Teacher, Parent          |
| 9   | My Children           | `(tabs)/students/my-children`           | Parent                          |
| 10  | Finance Overview      | `(tabs)/finance/index`                  | Admin, Accountant, Parent       |
| 11  | Invoice Detail        | `(tabs)/finance/[invoiceId]`            | Admin, Accountant, Parent       |
| 12  | Payment Receipt       | `(tabs)/finance/payment/[paymentId]`    | Admin, Accountant, Parent       |
| 13  | Notifications         | `(tabs)/notifications`                  | All authenticated               |
| 14  | Profile               | `(tabs)/profile/index`                  | All authenticated               |
| 15  | Change Password       | `(tabs)/profile/change-password`        | All authenticated               |
| 16  | App Settings          | `(tabs)/profile/app-settings`           | All authenticated               |
