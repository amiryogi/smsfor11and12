import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse } from "../types/api.types";
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
} from "../types/user.types";

export const usersApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<User>>("/users", { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<User>>(`/users/${id}`).then((r) => r.data),

  create: (input: CreateUserInput) =>
    apiClient.post<ApiResponse<User>>("/users", input).then((r) => r.data),

  update: (id: string, input: UpdateUserInput) =>
    apiClient
      .patch<ApiResponse<User>>(`/users/${id}`, input)
      .then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/users/${id}`).then((r) => r.data),
};
