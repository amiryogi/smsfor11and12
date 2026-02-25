import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";
import { useQueryClient } from "@tanstack/react-query";
import { getToken } from "./storage";
import { notificationKeys } from "../hooks/useNotifications";
import { useAuthStore } from "../stores/auth.store";

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
