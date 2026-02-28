import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";
import type { Role } from "../../types/api.types";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: Role[];
  fallbackPath?: string;
}

/**
 * Restricts page access to specific roles.
 * Redirects to fallbackPath (default: /dashboard) if the user's role is not allowed.
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallbackPath = "/dashboard",
}: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role as Role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
