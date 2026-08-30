import { apiClient, clearStoredTokens, getStoredRefreshToken, setStoredTokens } from "./client";

export type RoleCode =
  | "student"
  | "teacher"
  | "teaching_assistant"
  | "content_manager"
  | "lms_admin"
  | "super_admin";

export interface StudentProfileDto {
  student_id: string | null;
  group: string | null;
}

export interface CurrentUserDto {
  id: number;
  email: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  roles: RoleCode[];
  permissions: string[];
  profile: StudentProfileDto | null;
}

export interface LoginResponseDto {
  user: {
    id: number;
    email: string | null;
    full_name: string;
    roles: RoleCode[];
  };
  access?: string;
  refresh?: string;
}

export interface MessageResponseDto {
  message: string;
  access?: string;
}

export interface LoginPayload {
  login: string;
  password: string;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponseDto> {
    const response = await apiClient.post<LoginResponseDto>("/auth/login/", payload, {
      skipAuthRefresh: true,
    });
    if (response?.access) {
      setStoredTokens({ access: response.access, refresh: response.refresh });
    }
    return response;
  },

  me(): Promise<CurrentUserDto> {
    return apiClient.get<CurrentUserDto>("/auth/me/");
  },

  async refresh(): Promise<MessageResponseDto> {
    const refreshToken = getStoredRefreshToken();
    const response = await apiClient.post<MessageResponseDto>(
      "/auth/refresh/",
      refreshToken ? { refresh: refreshToken } : undefined,
      { skipAuthRefresh: true },
    );
    if (response?.access) {
      setStoredTokens({ access: response.access });
    }
    return response;
  },

  async logout(): Promise<MessageResponseDto> {
    try {
      return await apiClient.post<MessageResponseDto>("/auth/logout/", undefined, {
        skipAuthRefresh: true,
      });
    } finally {
      clearStoredTokens();
    }
  },
};

