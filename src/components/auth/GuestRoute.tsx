import type { ReactNode } from "react";
import { Redirect } from "react-router-dom";
import { getHomePathForRoles } from "../../auth/roles";
import { useAuth } from "../../auth/useAuth";
import { AuthLoadingScreen } from "./ProtectedRoute";

interface GuestRouteProps {
  children: ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  if (isAuthenticated && user) {
    return <Redirect to={getHomePathForRoles(user.roles)} />;
  }
  return <>{children}</>;
}

