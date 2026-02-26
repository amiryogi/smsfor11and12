import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../stores/auth.store";
import type { LoginInput, ChangePasswordInput } from "../types/auth.types";
import { toast } from "sonner";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => authApi.me(),
    enabled: isAuthenticated,
  });
}

export function useLogin() {
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => {
      setTokens(data.data.accessToken, data.data.refreshToken);
      setUser(data.data.user);
      toast.success("Logged in successfully");
    },
    onError: () => {
      toast.error("Invalid email or password");
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
      toast.success("Logged out");
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => authApi.changePassword(input),
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: () => {
      toast.error("Failed to change password");
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => authApi.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      toast.success("Profile photo updated");
    },
    onError: () => {
      toast.error("Failed to upload photo");
    },
  });
}
