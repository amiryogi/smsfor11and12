# Context: Mobile API Client, Authentication & State Management

## Domain: NEB +2 School Management ERP — React Native Expo

This document defines the API client, secure authentication flow, state management patterns, push notification integration, and offline support for the mobile app. The agent MUST follow these patterns exactly.

---

### 🚨 Strict Rules

1. **Tokens in SecureStore ONLY.** Access and refresh tokens are NEVER stored in AsyncStorage, MMKV, or React state. Use `expo-secure-store` exclusively.
2. **Auto token refresh.** The Axios interceptor MUST silently refresh expired access tokens using the stored refresh token before retrying the failed request.
3. **Logout on refresh failure.** If token refresh fails (401/403), clear all stored tokens and navigate to the login screen.
4. **All API calls through hooks.** Components MUST NOT call `apiClient` directly. All data fetching goes through TanStack Query hooks in `src/hooks/`.
5. **Query key factory pattern.** Every domain MUST use the key factory pattern (identical to web app doc 10) for consistent cache invalidation.
6. **Optimistic updates for mutations.** Mark-as-read, mark-all-read, and similar lightweight mutations SHOULD use optimistic updates via TanStack Query's `onMutate` callback.
7. **Error handling.** All API errors follow the backend envelope (doc 11): `{ success: false, error: { code, message, details }, statusCode }`. The API client MUST extract and normalize these.

---

### 🔌 1. Axios API Client (Mobile)

```typescript
// src/api/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Constants from "expo-constants";
import { getToken, setTokens, clearTokens } from "@utils/storage";
import { router } from "expo-router";

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl || "http://localhost:3000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Request Interceptor: Inject JWT ──
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = await getToken("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
);

// ── Response Interceptor: Auto-refresh on 401 ──
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If not a 401 or already retried, reject immediately
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(normalizeError(error));
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getToken("refreshToken");
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const newAccessToken = data.data.accessToken;
      const newRefreshToken = data.data.refreshToken;

      await setTokens(newAccessToken, newRefreshToken);
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearTokens();
      router.replace("/(auth)/login");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Error Normalizer ──
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  statusCode: number;
}

function normalizeError(error: AxiosError): ApiError {
  if (error.response?.data && typeof error.response.data === "object") {
    const envelope = error.response.data as any;
    if (envelope.error) {
      return {
        code: envelope.error.code ?? "UNKNOWN_ERROR",
        message: envelope.error.message ?? "An error occurred",
        details: envelope.error.details,
        statusCode: envelope.statusCode ?? error.response.status,
      };
    }
  }

  // Network or timeout error
  if (!error.response) {
    return {
      code: "NETWORK_ERROR",
      message: "Unable to connect. Please check your internet connection.",
      statusCode: 0,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred",
    statusCode: error.response.status,
  };
}
```

---

### 🔐 2. Secure Token Storage

```typescript
// src/utils/storage.ts
import * as SecureStore from "expo-secure-store";

const TOKEN_KEYS = {
  accessToken: "neb_access_token",
  refreshToken: "neb_refresh_token",
} as const;

type TokenKey = keyof typeof TOKEN_KEYS;

export async function getToken(key: TokenKey): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEYS[key]);
  } catch {
    return null;
  }
}

export async function setTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEYS.accessToken, accessToken),
    SecureStore.setItemAsync(TOKEN_KEYS.refreshToken, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEYS.accessToken),
    SecureStore.deleteItemAsync(TOKEN_KEYS.refreshToken),
  ]);
}
```

---

### 🗄 3. Zustand Auth Store (Mobile)

The mobile auth store uses MMKV for non-sensitive data (user profile, isAuthenticated flag) and SecureStore for tokens.

```typescript
// src/stores/auth.store.ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

const mmkv = new MMKV({ id: "neb-auth-store" });

// MMKV adapter for Zustand persist
const mmkvStorage = {
  getItem: (name: string) => {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    mmkv.set(name, value);
  },
  removeItem: (name: string) => {
    mmkv.delete(name);
  },
};

interface AuthUser {
  id: string;
  email: string;
  role: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;

  setUser: (user: AuthUser) => void;
  setAuthenticated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setAuthenticated: (value) => set({ isAuthenticated: value }),

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "neb-auth",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
```

**Critical:** Tokens are NOT in this store. They live in `expo-secure-store` only. The store holds the decoded user object and auth flag for UI rendering.

---

### 🗄 4. UI Preferences Store

```typescript
// src/stores/ui.store.ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

const mmkv = new MMKV({ id: "neb-ui-store" });

const mmkvStorage = {
  getItem: (name: string) => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.delete(name),
};

interface UIState {
  colorScheme: "light" | "dark" | "system";
  biometricEnabled: boolean;
  pushEnabled: boolean;

  setColorScheme: (scheme: "light" | "dark" | "system") => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setPushEnabled: (enabled: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      colorScheme: "system",
      biometricEnabled: false,
      pushEnabled: true,

      setColorScheme: (colorScheme) => set({ colorScheme }),
      setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),
      setPushEnabled: (pushEnabled) => set({ pushEnabled }),
    }),
    {
      name: "neb-ui",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
```

---

### 🔄 5. TanStack Query Hooks

#### 5.1 Auth Hooks

```typescript
// src/hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@api/client";
import { useAuthStore } from "@stores/auth.store";
import { setTokens, clearTokens } from "@utils/storage";
import { router } from "expo-router";

// ── API Functions ──
const authApi = {
  login: (body: { email: string; password: string }) =>
    apiClient.post("/auth/login", body).then((r) => r.data),

  me: () => apiClient.get("/auth/me").then((r) => r.data),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    apiClient.patch("/auth/change-password", body).then((r) => r.data),

  logout: () => apiClient.post("/auth/logout").then((r) => r.data),
};

// ── Login ──
export function useLogin() {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      // Store tokens securely
      await setTokens(data.data.accessToken, data.data.refreshToken);
      // Store user in Zustand (non-sensitive)
      setUser(data.data.user);
    },
  });
}

// ── Current User ──
export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ── Change Password ──
export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
  });
}

// ── Logout ──
export function useLogout() {
  const { logout: clearStore } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: async () => {
      // Always clear regardless of API success/failure
      await clearTokens();
      clearStore();
      queryClient.clear();
      router.replace("/(auth)/login");
    },
  });
}
```

#### 5.2 Students Hooks

```typescript
// src/hooks/useStudents.ts
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@api/client";

const studentsApi = {
  list: (params?: Record<string, any>) =>
    apiClient.get("/students", { params }).then((r) => r.data),

  getById: (id: string) => apiClient.get(`/students/${id}`).then((r) => r.data),

  enrollments: (studentId: string) =>
    apiClient.get(`/students/${studentId}/enrollments`).then((r) => r.data),
};

export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, "detail"] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
  enrollments: (id: string) =>
    [...studentKeys.detail(id), "enrollments"] as const,
};

export function useStudents(filters?: Record<string, any>) {
  return useQuery({
    queryKey: studentKeys.list(filters ?? {}),
    queryFn: () => studentsApi.list(filters),
  });
}

export function useInfiniteStudents(filters: { search?: string }) {
  return useInfiniteQuery({
    queryKey: ["students", "infinite", filters],
    queryFn: ({ pageParam = 1 }) =>
      studentsApi.list({ ...filters, page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage: any) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
  });
}

export function useStudentEnrollments(studentId: string) {
  return useQuery({
    queryKey: studentKeys.enrollments(studentId),
    queryFn: () => studentsApi.enrollments(studentId),
    enabled: !!studentId,
  });
}
```

#### 5.3 Exams Hooks

```typescript
// src/hooks/useExams.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@api/client";

const examsApi = {
  list: (params?: Record<string, any>) =>
    apiClient.get("/exams", { params }).then((r) => r.data),

  getById: (id: string) => apiClient.get(`/exams/${id}`).then((r) => r.data),

  studentResults: (examId: string, studentId?: string) =>
    apiClient
      .get(`/exams/${examId}/results/student/${studentId}`)
      .then((r) => r.data),

  bulkEnterMarks: (examId: string, marks: any[]) =>
    apiClient.post(`/exams/${examId}/results/bulk`, marks).then((r) => r.data),
};

export const examKeys = {
  all: ["exams"] as const,
  lists: () => [...examKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...examKeys.lists(), filters] as const,
  details: () => [...examKeys.all, "detail"] as const,
  detail: (id: string) => [...examKeys.details(), id] as const,
  results: (examId: string, studentId: string) =>
    [...examKeys.detail(examId), "results", studentId] as const,
};

export function useExams(filters?: Record<string, any>) {
  return useQuery({
    queryKey: examKeys.list(filters ?? {}),
    queryFn: () => examsApi.list(filters),
  });
}

export function useExam(examId: string) {
  return useQuery({
    queryKey: examKeys.detail(examId),
    queryFn: () => examsApi.getById(examId),
    enabled: !!examId,
  });
}

export function useStudentExamResults(examId: string, studentId?: string) {
  return useQuery({
    queryKey: examKeys.results(examId, studentId ?? ""),
    queryFn: () => examsApi.studentResults(examId, studentId),
    enabled: !!examId && !!studentId,
  });
}

export function useBulkEnterMarks(examId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (marks: any[]) => examsApi.bulkEnterMarks(examId, marks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.detail(examId) });
      queryClient.invalidateQueries({ queryKey: ["exams", "list"] });
    },
  });
}
```

#### 5.4 Finance Hooks

```typescript
// src/hooks/useFinance.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@api/client";

const financeApi = {
  invoices: (params?: Record<string, any>) =>
    apiClient.get("/finance/invoices", { params }).then((r) => r.data),

  invoiceById: (id: string) =>
    apiClient.get(`/finance/invoices/${id}`).then((r) => r.data),

  payments: (params?: Record<string, any>) =>
    apiClient.get("/finance/payments", { params }).then((r) => r.data),

  paymentById: (id: string) =>
    apiClient.get(`/finance/payments/${id}`).then((r) => r.data),

  createPayment: (body: any) =>
    apiClient.post("/finance/payments", body).then((r) => r.data),
};

export const financeKeys = {
  invoices: {
    all: ["invoices"] as const,
    lists: () => [...financeKeys.invoices.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...financeKeys.invoices.lists(), filters] as const,
    detail: (id: string) =>
      [...financeKeys.invoices.all, "detail", id] as const,
  },
  payments: {
    all: ["payments"] as const,
    lists: () => [...financeKeys.payments.all, "list"] as const,
    list: (filters: Record<string, any>) =>
      [...financeKeys.payments.lists(), filters] as const,
    detail: (id: string) =>
      [...financeKeys.payments.all, "detail", id] as const,
  },
};

export function useInvoices(filters?: Record<string, any>) {
  return useQuery({
    queryKey: financeKeys.invoices.list(filters ?? {}),
    queryFn: () => financeApi.invoices(filters),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: financeKeys.invoices.detail(id),
    queryFn: () => financeApi.invoiceById(id),
    enabled: !!id,
  });
}

export function usePayments(filters?: Record<string, any>) {
  return useQuery({
    queryKey: financeKeys.payments.list(filters ?? {}),
    queryFn: () => financeApi.payments(filters),
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: financeKeys.payments.detail(id),
    queryFn: () => financeApi.paymentById(id),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: financeApi.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices.lists() });
      queryClient.invalidateQueries({ queryKey: financeKeys.payments.lists() });
    },
  });
}
```

#### 5.5 Notifications Hooks

```typescript
// src/hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@api/client";

const notificationsApi = {
  list: (params?: Record<string, any>) =>
    apiClient.get("/notifications", { params }).then((r) => r.data),

  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    apiClient.post("/notifications/mark-all-read").then((r) => r.data),
};

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...notificationKeys.lists(), filters] as const,
};

export function useNotifications(filters?: Record<string, any>) {
  return useQuery({
    queryKey: notificationKeys.list(filters ?? {}),
    queryFn: () => notificationsApi.list(filters),
    refetchInterval: 30 * 1000, // Poll every 30s as fallback to WebSocket
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.markRead,
    onMutate: async (notificationId: string) => {
      // Optimistic update: mark as read immediately in UI
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
      const previousData = queryClient.getQueriesData({
        queryKey: notificationKeys.lists(),
      });

      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((n: any) =>
              n.id === notificationId ? { ...n, isRead: true } : n,
            ),
          };
        },
      );

      return { previousData };
    },
    onError: (_err, _id, context) => {
      // Rollback optimistic update on error
      context?.previousData?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
}
```

#### 5.6 Reports / Dashboard Hooks

```typescript
// src/hooks/useReports.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@api/client";

const reportsApi = {
  studentSummary: () =>
    apiClient.get("/reports/students/summary").then((r) => r.data),

  financeSummary: () =>
    apiClient.get("/reports/finance/outstanding").then((r) => r.data),

  financeLedger: (params?: Record<string, any>) =>
    apiClient.get("/reports/finance/ledger", { params }).then((r) => r.data),

  studentFinance: (studentId: string) =>
    apiClient.get(`/reports/finance/student/${studentId}`).then((r) => r.data),
};

export function useStudentSummary() {
  return useQuery({
    queryKey: ["reports", "students", "summary"],
    queryFn: reportsApi.studentSummary,
    staleTime: 10 * 60 * 1000, // 10min — dashboard data doesn't need real-time
  });
}

export function useFinanceSummary() {
  return useQuery({
    queryKey: ["reports", "finance", "summary"],
    queryFn: reportsApi.financeSummary,
    staleTime: 10 * 60 * 1000,
  });
}

export function useDashboardData() {
  // Combined refetch for pull-to-refresh on dashboard
  const students = useStudentSummary();
  const finance = useFinanceSummary();

  return {
    isRefetching: students.isRefetching || finance.isRefetching,
    refetch: async () => {
      await Promise.all([students.refetch(), finance.refetch()]);
    },
  };
}
```

---

### 📲 6. Push Notification Setup

```typescript
// src/utils/push-notifications.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiClient } from "@api/client";

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and send the token to the backend.
 * Called after successful login (in root layout).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device");
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission not granted");
    return null;
  }

  // Get Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  const pushToken = tokenData.data;

  // Android: Set notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1E40AF",
    });
  }

  // Send push token to backend for storage
  try {
    await apiClient.post("/notifications/push-token", {
      token: pushToken,
      platform: Platform.OS,
    });
  } catch (error) {
    console.error("Failed to register push token with backend:", error);
  }

  return pushToken;
}

/**
 * Hook to handle notification received + tapped events.
 * Use in the root layout.
 */
export function useNotificationListeners() {
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      // Notification received while app is in foreground
      // TanStack Query will refetch notifications list automatically
      console.log("Notification received:", notification);
    },
  );

  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      // User tapped the notification
      const data = response.notification.request.content.data;

      // Deep link based on notification type
      if (data?.type === "EXAM_PUBLISHED" && data?.examId) {
        // Navigate to exam detail
        // router.push(`/(tabs)/academics/${data.examId}`);
      } else if (data?.type === "PAYMENT_RECEIVED" && data?.paymentId) {
        // Navigate to payment receipt
        // router.push(`/(tabs)/finance/payment/${data.paymentId}`);
      }
    });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}
```

---

### 🌐 7. WebSocket Integration (Real-time Notifications)

```typescript
// src/utils/websocket.ts
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";
import { useQueryClient } from "@tanstack/react-query";
import { getToken } from "@utils/storage";
import { notificationKeys } from "@hooks/useNotifications";
import { useAuthStore } from "@stores/auth.store";

const WS_URL = Constants.expoConfig?.extra?.wsUrl || "http://localhost:3000";

/**
 * Hook that connects to the WebSocket server for real-time notifications.
 * Must be mounted in the authenticated layout.
 */
export function useRealtimeNotifications() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    let socket: Socket;

    const connect = async () => {
      const token = await getToken("accessToken");
      if (!token) return;

      socket = io(`${WS_URL}/notifications`, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 3000,
      });

      socket.on("connect", () => {
        console.log("WebSocket connected");
      });

      // Real-time events — invalidate notification queries to refetch
      socket.on("PDF_READY", () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      });

      socket.on("EXAM_PUBLISHED", () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        queryClient.invalidateQueries({ queryKey: ["exams"] });
      });

      socket.on("PAYMENT_RECEIVED", () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        queryClient.invalidateQueries({ queryKey: ["payments"] });
      });

      socket.on("JOB_FAILED", () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      });

      socketRef.current = socket;
    };

    connect();

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, queryClient]);
}
```

---

### 📴 8. Offline Support Strategy

The mobile app uses TanStack Query's built-in caching as the offline layer. No separate offline database is needed.

```typescript
// src/constants/config.ts
export const QUERY_CONFIG = {
  // How long data is considered "fresh" (no refetch)
  staleTime: 5 * 60 * 1000, // 5 minutes

  // How long data stays in cache after all components unmount
  gcTime: 30 * 60 * 1000, // 30 minutes

  // For critical data (student results, invoices), use longer cache
  criticalStaleTime: 15 * 60 * 1000, // 15 minutes
  criticalGcTime: 60 * 60 * 1000, // 1 hour
} as const;
```

**Offline behavior rules:**

1. **Read-only offline access.** Previously fetched data (exam results, invoices, student profiles) is available offline from TanStack Query cache.
2. **Write operations require connectivity.** Mutations (marks entry, payments) show a "No internet connection" error when offline. NO offline write queue — financial data requires server-side ACID guarantees.
3. **Stale data indicator.** When displaying cached data while offline, show a banner: "You're offline. Showing last updated data."
4. **Reconnection refetch.** TanStack Query's `refetchOnReconnect: true` (set in root config) automatically refreshes stale data when connectivity returns.

```tsx
// src/components/layout/OfflineBanner.tsx
import { View, Text } from "react-native";
import { useNetInfo } from "@react-native-community/netinfo";

export function OfflineBanner() {
  const netInfo = useNetInfo();

  if (netInfo.isConnected !== false) return null;

  return (
    <View className="bg-warning px-4 py-2">
      <Text className="text-white text-center text-sm font-sans-medium">
        You're offline. Showing cached data.
      </Text>
    </View>
  );
}
```

---

### 🧰 9. Shared Utilities

```typescript
// src/utils/format.ts

/**
 * Format a number as Nepali Rupees (NPR).
 * Example: formatNPR(15000) → "रु. 15,000.00"
 */
export function formatNPR(amount: number): string {
  return `रु. ${amount.toLocaleString("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a date string for display.
 * Example: formatDate("2025-12-15") → "Dec 15, 2025"
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date as relative time.
 * Example: formatRelativeTime("2025-12-14T10:00:00Z") → "2 hours ago"
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}
```

---

### 🔑 10. Biometric Authentication (Optional)

```typescript
// src/utils/biometrics.ts
import * as LocalAuthentication from "expo-local-authentication";
import { useUIStore } from "@stores/ui.store";

/**
 * Check if biometric hardware is available.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

/**
 * Prompt user for biometric authentication.
 * Returns true if authenticated, false if cancelled/failed.
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock NEB School ERP",
    cancelLabel: "Use Password",
    disableDeviceFallback: false,
    fallbackLabel: "Use Passcode",
  });

  return result.success;
}

/**
 * Use in root layout to gate app access with biometrics.
 */
export function useBiometricGate() {
  const biometricEnabled = useUIStore((s) => s.biometricEnabled);
  // If biometric is enabled, show biometric prompt on app foreground
  // Implementation: track AppState changes + prompt on "active"
  return { biometricEnabled };
}
```

---

### 📐 11. TypeScript Types (API Shapes)

```typescript
// src/types/api.types.ts

/** Standard success response envelope (from backend doc 11) */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

/** Standard error response envelope */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  statusCode: number;
}

/** Pagination metadata */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Paginated response shorthand */
export type PaginatedResponse<T> = ApiResponse<T[]>;
```

```typescript
// src/types/auth.types.ts
export interface AuthUser {
  id: string;
  email: string;
  role:
    | "SUPER_ADMIN"
    | "ADMIN"
    | "TEACHER"
    | "ACCOUNTANT"
    | "PARENT"
    | "STUDENT";
  schoolId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
```

```typescript
// src/types/exam.types.ts
export interface Exam {
  id: string;
  name: string;
  examType: "UNIT_TEST" | "TERMINAL" | "PREBOARD" | "FINAL";
  status: "DRAFT" | "MARKS_ENTRY" | "FINALIZED" | "PUBLISHED";
  startDate?: string;
  endDate?: string;
  academicYear?: { id: string; name: string };
  term?: { id: string; name: string };
}

export interface ExamResult {
  id: string;
  subjectName: string;
  subjectCode: string;
  theoryMarksObtained?: number;
  theoryFullMarks: number;
  theoryGrade?: string;
  practicalMarksObtained?: number;
  practicalFullMarks?: number;
  practicalGrade?: string;
  finalGrade: string;
  finalGradePoint?: number;
  isNg: boolean;
}
```

```typescript
// src/types/finance.types.ts
export interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  academicYearName: string;
  status: "DRAFT" | "UNPAID" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  dueDate?: string;
  lineItems?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  feeType: string;
  description: string;
  amount: number;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  invoiceId: string;
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CHEQUE" | "ONLINE";
  referenceNo?: string;
  receiptS3Key?: string;
  createdAt: string;
}
```
