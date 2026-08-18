import type { UserListParams } from "./users.api";

export const referenceKeys = {
  usersAll: ["users"] as const,
  users: (params: UserListParams) => ["users", "list", params] as const,
  user: (userId: number) => ["users", "detail", userId] as const,
  roles: ["roles"] as const,
  organization: ["organization"] as const,
  faculties: ["organization", "faculties"] as const,
  departments: (facultyId?: number) => ["organization", "departments", facultyId] as const,
  programs: (departmentId?: number) => ["organization", "programs", departmentId] as const,
  semesters: ["organization", "semesters"] as const,
};

