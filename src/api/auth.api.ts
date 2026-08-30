import { apiClient } from "./client";

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
}

export interface MessageResponseDto {
  message: string;
}

export interface LoginPayload {
  login: string;
  password: string;
}

export const authApi = {
  login(payload: LoginPayload): Promise<LoginResponseDto> {
    return apiClient.post<LoginResponseDto>("/auth/login/", payload, {
      skipAuthRefresh: true,
    });
  },

  me(): Promise<CurrentUserDto> {
    return apiClient.get<CurrentUserDto>("/auth/me/");
  },

  refresh(): Promise<MessageResponseDto> {
    return apiClient.post<MessageResponseDto>("/auth/refresh/", undefined, {
      skipAuthRefresh: true,
    });
  },

  logout(): Promise<MessageResponseDto> {
    return apiClient.post<MessageResponseDto>("/auth/logout/", undefined, {
      skipAuthRefresh: true,
    });
  },
};

