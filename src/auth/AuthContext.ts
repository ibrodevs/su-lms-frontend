import { createContext } from "react";
import type { CurrentUserDto, LoginPayload } from "../api/auth.api";

export interface AuthContextValue {
  user: CurrentUserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginPayload) => Promise<CurrentUserDto>;
  logout: () => Promise<void>;
  refresh: () => Promise<CurrentUserDto>;
  refetchUser: () => Promise<CurrentUserDto | null>;
  can: (permission: string) => boolean;
  canAny: (...permissions: string[]) => boolean;
  canAll: (...permissions: string[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

