import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "../../stores/auth.store";
import { authApi } from "../../api/auth.api";

/**
 * Attempts a silent token refresh on app load using the httpOnly cookie.
 * While refreshing, `isInitializing` stays true so AuthGuard shows a loader
 * instead of redirecting to /login.
 */
export function AuthInitializer({ children }: { children: ReactNode }) {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const login = useAuthStore((s) => s.login);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    // Remove stale persisted auth data from previous version
    localStorage.removeItem("sms-auth");

    let cancelled = false;

    async function silentRefresh() {
      try {
        const refreshRes = await authApi.refresh();
        if (cancelled) return;

        const accessToken = refreshRes.data.accessToken;
        setAccessToken(accessToken);

        // Fetch user profile with the new token
        const meRes = await authApi.me();
        if (cancelled) return;

        login(accessToken, meRes.data);
      } catch {
        // No valid refresh cookie — user is not authenticated
      } finally {
        if (!cancelled) setInitialized();
      }
    }

    silentRefresh();
    return () => {
      cancelled = true;
    };
  }, [setAccessToken, setUser, login, setInitialized]);

  return <>{children}</>;
}
