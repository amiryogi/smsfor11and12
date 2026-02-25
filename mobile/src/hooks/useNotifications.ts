import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";

const notificationsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get("/notifications", { params }).then((r) => r.data),

  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    apiClient.post("/notifications/mark-all-read").then((r) => r.data),
};

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...notificationKeys.lists(), filters] as const,
};

export function useNotifications(filters?: Record<string, unknown>) {
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
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
      const previousData = queryClient.getQueriesData({
        queryKey: notificationKeys.lists(),
      });

      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (old: unknown) => {
          const data = old as
            | { data?: Array<{ id: string; isRead: boolean }> }
            | undefined;
          if (!data?.data) return old;
          return {
            ...data,
            data: data.data.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n,
            ),
          };
        },
      );

      return { previousData };
    },
    onError: (_err, _id, context) => {
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
