import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse } from "../types/api.types";
import type { Notification } from "../types/notification.types";

export const notificationsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<Notification>>("/notifications", { params })
      .then((r) => r.data),

  markAsRead: (id: string) =>
    apiClient
      .patch<ApiResponse<Notification>>(`/notifications/${id}/read`)
      .then((r) => r.data),

  markAllRead: () =>
    apiClient
      .post<ApiResponse<{ message: string }>>("/notifications/mark-all-read")
      .then((r) => r.data),
};
