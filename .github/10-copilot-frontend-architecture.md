# Context: Frontend Architecture & Patterns

## Domain: NEB +2 School Management ERP

This document defines the frontend architecture, component patterns, state management, API client setup, and routing structure. The agent MUST follow these conventions when generating any React code.

### 🛠 Tech Stack

- **Framework:** React 18+ with TypeScript (strict mode)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4.2 (utility-first, no CSS modules)
- **Routing:** React Router v6 (data router with `createBrowserRouter`)
- **Server State:** TanStack Query v5 (React Query) — ALL API data fetching
- **Client State:** Zustand — auth tokens, UI state (sidebar, modals)
- **Forms:** React Hook Form + Zod (schema validation)
- **HTTP Client:** Axios with interceptors
- **WebSockets:** Socket.io-client (for real-time notifications)

### 🚨 Strict Frontend Rules

1. **No `useEffect` for data fetching.** ALL API calls MUST go through TanStack Query hooks (`useQuery`, `useMutation`). NEVER use `useEffect` + `fetch/axios` directly.
2. **No prop drilling.** Use Zustand stores for global state (auth, UI). Use TanStack Query for server state. Pass data via props only 1-2 levels deep.
3. **No inline styles.** Use Tailwind utility classes exclusively. No `style={{}}` or CSS-in-JS.
4. **No `any` type.** All API responses, props, and state must be fully typed. Define types in `src/types/`.
5. **Components are functional.** No class components. No default exports (use named exports only).
6. **Currency is NPR.** All money values must display with `रु.` prefix and Nepali number formatting.

---

### 🔌 1. Axios API Client

The agent MUST use this centralized Axios instance. It handles JWT injection, token refresh, and error normalization.

```typescript
// src/api/client.ts
import axios from "axios";
import { useAuthStore } from "../stores/auth.store";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: Inject access token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 + token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        useAuthStore
          .getState()
          .setTokens(data.data.accessToken, data.data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
```

**API module example:**

```typescript
// src/api/students.api.ts
import { apiClient } from "./client";
import type {
  Student,
  CreateStudentInput,
  PaginatedResponse,
} from "../types/student.types";

export const studentsApi = {
  list: (params?: Record<string, any>) =>
    apiClient
      .get<PaginatedResponse<Student>>("/students", { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<{ success: true; data: Student }>(`/students/${id}`)
      .then((r) => r.data),

  create: (input: CreateStudentInput) =>
    apiClient
      .post<{ success: true; data: Student }>("/students", input)
      .then((r) => r.data),

  update: (id: string, input: Partial<CreateStudentInput>) =>
    apiClient
      .patch<{ success: true; data: Student }>(`/students/${id}`, input)
      .then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/students/${id}`).then((r) => r.data),
};
```

---

### 🗄 2. Zustand Auth Store

```typescript
// src/stores/auth.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  id: string;
  email: string;
  role: string;
  schoolId: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;

  setTokens: (access: string, refresh: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setTokens: (access, refresh) =>
        set({
          accessToken: access,
          refreshToken: refresh,
          isAuthenticated: true,
        }),

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "sms-auth", // localStorage key
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
```

---

### 🔄 3. TanStack Query Hooks Pattern

All data fetching MUST use this pattern. The agent must create one hooks file per domain.

```typescript
// src/hooks/useStudents.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi } from "../api/students.api";
import type { CreateStudentInput } from "../types/student.types";

// Query keys — consistent and refetchable
export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, "detail"] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};

export function useStudents(filters?: Record<string, any>) {
  return useQuery({
    queryKey: studentKeys.list(filters ?? {}),
    queryFn: () => studentsApi.list(filters),
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStudentInput) => studentsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useUpdateStudent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<CreateStudentInput>) =>
      studentsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}
```

**Rules:**

- EVERY `useMutation` must invalidate the relevant queries on success.
- Query keys MUST use the factory pattern (shown above) for consistency.
- NEVER call `apiClient` directly in components. Always go through hooks.

---

### 🛤 4. Routing Structure

```typescript
// src/App.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage /> },

  // Protected routes (wrapped in AuthLayout)
  {
    element: <AuthGuard />,  // Redirects to /login if not authenticated
    children: [
      {
        element: <DashboardLayout />,  // Shell with Sidebar + Topbar
        children: [
          { path: '/', element: <DashboardPage /> },

          // Students
          { path: '/students', element: <StudentsListPage /> },
          { path: '/students/new', element: <StudentCreatePage /> },
          { path: '/students/:id', element: <StudentDetailPage /> },
          { path: '/students/:id/edit', element: <StudentEditPage /> },

          // Academics
          { path: '/academic/years', element: <AcademicYearsPage /> },
          { path: '/academic/grades', element: <GradesPage /> },
          { path: '/academic/subjects', element: <SubjectsPage /> },

          // Exams
          { path: '/exams', element: <ExamsListPage /> },
          { path: '/exams/:id', element: <ExamDetailPage /> },
          { path: '/exams/:id/marks-entry', element: <MarksEntryPage /> },
          { path: '/exams/:id/results', element: <ExamResultsPage /> },

          // Finance
          { path: '/finance/fee-structures', element: <FeeStructuresPage /> },
          { path: '/finance/invoices', element: <InvoicesPage /> },
          { path: '/finance/invoices/:id', element: <InvoiceDetailPage /> },
          { path: '/finance/payments', element: <PaymentsPage /> },
          { path: '/finance/payments/new', element: <PaymentCreatePage /> },

          // Reports
          { path: '/reports/exam/:examId', element: <ExamReportPage /> },
          { path: '/reports/finance/ledger', element: <FinancialLedgerPage /> },
          { path: '/reports/finance/outstanding', element: <OutstandingPage /> },

          // Users
          { path: '/users', element: <UsersPage /> },

          // Settings
          { path: '/settings', element: <SchoolSettingsPage /> },
        ],
      },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

---

### 🧩 5. Component Patterns

**Page Component (list with table):**

```tsx
// src/pages/students/StudentsListPage.tsx
import { useState } from "react";
import { useStudents } from "../../hooks/useStudents";
import { DataTable } from "../../components/ui/DataTable";
import { PageHeader } from "../../components/layout/PageHeader";
import { Link } from "react-router-dom";

export function StudentsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useStudents({ page, limit: 20, search });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message="Failed to load students" />;

  return (
    <div>
      <PageHeader
        title="Students"
        action={
          <Link to="/students/new" className="btn-primary">
            Add Student
          </Link>
        }
      />
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by name..."
      />
      <DataTable
        columns={studentColumns}
        data={data?.data ?? []}
        pagination={data?.meta}
        onPageChange={setPage}
      />
    </div>
  );
}
```

**Form Component (with React Hook Form + Zod):**

```tsx
// src/pages/students/StudentCreatePage.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateStudent } from "../../hooks/useStudents";
import { useNavigate } from "react-router-dom";

const studentSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  registrationNo: z
    .string()
    .min(1)
    .regex(/^[0-9-]+$/, "Only digits and hyphens"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
});

type StudentFormData = z.infer<typeof studentSchema>;

export function StudentCreatePage() {
  const navigate = useNavigate();
  const createStudent = useCreateStudent();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  const onSubmit = async (data: StudentFormData) => {
    await createStudent.mutateAsync(data);
    navigate("/students");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
      <FormField label="First Name" error={errors.firstName?.message}>
        <input {...register("firstName")} className="input" />
      </FormField>
      <FormField label="Last Name" error={errors.lastName?.message}>
        <input {...register("lastName")} className="input" />
      </FormField>
      <FormField
        label="NEB Registration No."
        error={errors.registrationNo?.message}
      >
        <input {...register("registrationNo")} className="input" />
      </FormField>
      <FormField label="Date of Birth" error={errors.dob?.message}>
        <input type="date" {...register("dob")} className="input" />
      </FormField>
      <FormField label="Gender" error={errors.gender?.message}>
        <select {...register("gender")} className="input">
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </FormField>
      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? "Saving..." : "Create Student"}
      </button>
    </form>
  );
}
```

---

### 🔔 6. WebSocket Integration

```typescript
// src/hooks/useNotifications.ts
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner"; // Or any toast library

let socket: Socket | null = null;

export function useRealtimeNotifications() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    socket = io(
      `${import.meta.env.VITE_WS_URL || "http://localhost:3000"}/notifications`,
      { auth: { token: accessToken } },
    );

    socket.on("PDF_READY", (payload) => {
      toast.success(payload.message);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    socket.on("EXAM_PUBLISHED", (payload) => {
      toast.info(payload.message);
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    });

    socket.on("PAYMENT_RECEIVED", (payload) => {
      toast.success(payload.message);
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    });

    socket.on("JOB_FAILED", (payload) => {
      toast.error(payload.message);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [isAuthenticated, accessToken]);
}
```

**Mount in the DashboardLayout:**

```tsx
// src/components/layout/DashboardLayout.tsx
export function DashboardLayout() {
  useRealtimeNotifications(); // Connect WebSocket when user enters dashboard

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

---

### 🎨 7. Tailwind Design Tokens

Define consistent design tokens so the agent generates uniform UI:

```typescript
// tailwind.config.ts (partial)
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          500: "#3b82f6", // Main brand blue
          600: "#2563eb",
          700: "#1d4ed8",
        },
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
    },
  },
};
```

**Standard CSS classes the agent should use:**

```css
/* Applied via @layer in global CSS or Tailwind @apply */
.btn-primary    → bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700
.btn-secondary  → bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200
.btn-danger     → bg-danger text-white px-4 py-2 rounded-lg hover:bg-red-600
.input          → w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500
.card           → bg-white rounded-xl shadow-sm border border-gray-200 p-6
```

---

### 💱 8. Currency Formatting (NPR)

```typescript
// src/utils/format-currency.ts
export function formatNPR(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `रु. ${num.toLocaleString("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
```

**Rule:** EVERY place money is displayed MUST use `formatNPR()`. NEVER display raw numbers for financial data.

---

### 📊 9. Role-Based UI Rendering

Different roles see different sidebar items and pages. The agent MUST implement this:

```typescript
// src/utils/role-permissions.ts
import type { Role } from "../types/api.types";

const roleMenuMap: Record<Role, string[]> = {
  SUPER_ADMIN: [
    "dashboard",
    "schools",
    "users",
    "students",
    "academic",
    "exams",
    "finance",
    "reports",
    "settings",
  ],
  ADMIN: [
    "dashboard",
    "users",
    "students",
    "academic",
    "exams",
    "finance",
    "reports",
    "settings",
  ],
  TEACHER: ["dashboard", "students", "exams"],
  ACCOUNTANT: ["dashboard", "finance", "reports"],
  PARENT: ["dashboard", "students", "exams", "finance"],
  STUDENT: ["dashboard", "exams"],
};

export function getMenuItemsForRole(role: Role): string[] {
  return roleMenuMap[role] ?? [];
}
```

**Rule:** The Sidebar component MUST filter menu items using `getMenuItemsForRole()`. NEVER show admin pages to PARENT/STUDENT roles.

---

### 🚨 Rules for the Agent

1. **File naming:** All component files use PascalCase: `StudentCreatePage.tsx`. All hook/utility files use camelCase: `useStudents.ts`.
2. **One component per file.** No multi-component files except tiny internal helpers.
3. **Exports are named.** `export function StudentCreatePage()` — no `export default`.
4. **API types mirror backend DTOs.** When the backend has a `CreatePaymentDto`, the frontend has a matching `CreatePaymentInput` type.
5. **Loading and error states are mandatory.** Every page using `useQuery` must handle `isLoading` and `isError` explicitly. No blank screens.
6. **Toast notifications for mutations.** Every `useMutation` success/error must show a toast notification via `sonner` or equivalent.
7. **All forms validate client-side.** Use Zod schemas matching the backend DTOs. Do not rely solely on server-side validation.
