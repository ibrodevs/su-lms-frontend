import type { RoleCode } from "./auth.api";
import { apiClient } from "./client";

export interface RoleDto {
  code: RoleCode;
  name: string;
  description: string;
}

export const rolesApi = {
  list(): Promise<RoleDto[]> {
    return apiClient.get<RoleDto[]>("/roles/");
  },
};

