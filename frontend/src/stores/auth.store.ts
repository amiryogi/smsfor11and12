import { create } from "zustand";
import type { AuthUser } from "../types/auth.types";

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True while the app is attempting a silent refresh on load */
  isInitializing: boolean;

  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  setInitialized: () => void;
  login: (accessToken: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  setAccessToken: (token) => set({ accessToken: token }),

  setUser: (user) => set({ user }),

  setInitialized: () => set({ isInitializing: false }),

  login: (accessToken, user) =>
    set({
      accessToken,
      user,
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    }),
}));
