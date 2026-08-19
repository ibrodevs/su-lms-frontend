import { useMemo } from "react";
import { createLegacyStaffSession } from "./roles";
import { useAuth } from "./useAuth";

export function useLegacyStaffSession() {
  const { user } = useAuth();
  return useMemo(() => createLegacyStaffSession(user?.roles ?? []), [user?.roles]);
}

