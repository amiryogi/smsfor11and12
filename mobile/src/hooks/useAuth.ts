import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { setTokens, clearTokens } from "../utils/storage";
import { useAuthStore } from "../stores/auth.store";
import type {
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  AuthUser,
} from "../types/auth.types";
import type { ApiResponse } from "../types/api.types";

const authApi = {
  login: (body: LoginRequest) =>
    apiClient
      .post<ApiResponse<LoginResponse>>("/auth/login", body)
      .then((r) => r.data),

  me: () =>
    apiClient.get<ApiResponse<AuthUser>>("/auth/me").then((r) => r.data),

  changePassword: (body: ChangePasswordRequest) =>
    apiClient.patch("/auth/change-password", body).then((r) => r.data),

  logout: () => apiClient.post("/auth/logout").then((r) => r.data),
};

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (response) => {
      const { accessToken, refreshToken, user } = response.data;
      await setTokens(accessToken, refreshToken);
      setUser(user);
    },
  });
}

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: async () => {
      await clearTokens();
      clearAuth();
      queryClient.clear();
    },
  });
}
