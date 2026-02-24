import { apiClient } from "./client";
import type { ApiResponse } from "../types/api.types";
import type {
  LoginInput,
  LoginResponse,
  AuthUser,
  ChangePasswordInput,
} from "../types/auth.types";

export const authApi = {
  login: (input: LoginInput) =>
    apiClient
      .post<ApiResponse<LoginResponse>>("/auth/login", input)
      .then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient
      .post<
        ApiResponse<{ accessToken: string; refreshToken: string }>
      >("/auth/refresh", { refreshToken })
      .then((r) => r.data),

  logout: () => apiClient.post("/auth/logout").then((r) => r.data),

  me: () =>
    apiClient.get<ApiResponse<AuthUser>>("/auth/me").then((r) => r.data),

  changePassword: (input: ChangePasswordInput) =>
    apiClient
      .post<ApiResponse<{ message: string }>>("/auth/change-password", input)
      .then((r) => r.data),
};
