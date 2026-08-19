import type { ReactNode } from "react";
import { Redirect, useLocation } from "react-router-dom";
import type { RoleCode } from "../../api/auth.api";
import { hasAnyRole } from "../../auth/roles";
import { useAuth } from "../../auth/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: readonly RoleCode[];
}

export function AuthLoadingScreen() {
  return (
    <div className="student-theme grid min-h-screen place-items-center p-6">
      <div className="grid justify-items-center gap-3 text-center">
        <span className="size-10 animate-pulse rounded-full border-4 border-ecto border-t-transparent" />
        <p className="text-sm font-black text-ash">Проверка сессии…</p>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoadingScreen />;
  if (!isAuthenticated || !user) {
    return <Redirect to={{ pathname: "/login", state: { from: location.pathname } }} />;
  }
  if (allowedRoles && !hasAnyRole(user.roles, allowedRoles)) {
    return <Redirect to="/403" />;
  }
  return <>{children}</>;
}

