import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { notificationsApi } from "../api/notifications.api";
import { useAuthStore } from "../stores/auth.store";
import { toast } from "sonner";

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
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.lists() });
      toast.success("All notifications marked as read");
    },
  });
}

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

    socket.on("PDF_READY", (payload: { message: string }) => {
      toast.success(payload.message);
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    });

    socket.on("EXAM_PUBLISHED", (payload: { message: string }) => {
      toast.info(payload.message);
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    });

    socket.on("PAYMENT_RECEIVED", (payload: { message: string }) => {
      toast.success(payload.message);
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    });

    socket.on("JOB_FAILED", (payload: { message: string }) => {
      toast.error(payload.message);
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [isAuthenticated, accessToken, queryClient]);
}
