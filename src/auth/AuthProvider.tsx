import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { authApi } from "../api/auth.api";
import type { CurrentUserDto, LoginPayload } from "../api/auth.api";
import { ApiClientError } from "../api/errors";
import { queryClient } from "../api/queryClient";
import { AuthContext } from "./AuthContext";
import { authQueryKeys } from "./queryKeys";
import { clearAuthenticatedCache } from "./sessionCache";

interface AuthProviderProps {
  children: ReactNode;
}

async function loadCurrentUser(): Promise<CurrentUserDto | null> {
  try {
    return await authApi.me();
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data, isPending, refetch } = useQuery({
    queryKey: authQueryKeys.me,
    queryFn: loadCurrentUser,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
  const user = data ?? null;
  const permissionSet = useMemo(
    () => new Set(user?.permissions ?? []),
    [user?.permissions],
  );

  const login = useCallback(async (credentials: LoginPayload) => {
    await authApi.login(credentials);
    const currentUser = await authApi.me();
    queryClient.setQueryData(authQueryKeys.me, currentUser);
    return currentUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      await clearAuthenticatedCache(queryClient);
    }
  }, []);

  const refresh = useCallback(async () => {
    await authApi.refresh();
    const currentUser = await authApi.me();
    queryClient.setQueryData(authQueryKeys.me, currentUser);
    return currentUser;
  }, []);

  const refetchUser = useCallback(async () => {
    const result = await refetch();
    if (result.error) throw result.error;
    return result.data ?? null;
  }, [refetch]);

  const can = useCallback(
    (permission: string) => permissionSet.has(permission),
    [permissionSet],
  );
  const canAny = useCallback(
    (...permissions: string[]) => permissions.some((permission) => permissionSet.has(permission)),
    [permissionSet],
  );
  const canAll = useCallback(
    (...permissions: string[]) => permissions.every((permission) => permissionSet.has(permission)),
    [permissionSet],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading: isPending,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refresh,
      refetchUser,
      can,
      canAny,
      canAll,
    }),
    [
      isPending,
      can,
      canAll,
      canAny,
      login,
      logout,
      refetchUser,
      refresh,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
