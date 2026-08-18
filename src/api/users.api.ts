import type { RoleCode } from "./auth.api";
import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";

export interface UserDto {
  id: number;
  email: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  roles: RoleCode[];
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: RoleCode;
  isActive?: boolean;
}

export interface CreateUserPayload {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  roles: RoleCode[];
}

function buildUserListPath(params: UserListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("page_size", String(params.pageSize));
  if (params.search) searchParams.set("search", params.search);
  if (params.role) searchParams.set("role", params.role);
  if (params.isActive !== undefined) searchParams.set("is_active", String(params.isActive));
  const query = searchParams.toString();
  return `/users/${query ? `?${query}` : ""}`;
}

export const usersApi = {
  list(params: UserListParams = {}): Promise<PaginatedResponse<UserDto>> {
    return apiClient.get<PaginatedResponse<UserDto>>(buildUserListPath(params));
  },

  detail(userId: number): Promise<UserDto> {
    return apiClient.get<UserDto>(`/users/${userId}/`);
  },

  create(payload: CreateUserPayload): Promise<UserDto> {
    return apiClient.post<UserDto>("/users/", payload);
  },
};

