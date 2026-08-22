import type { RoleCode } from "../api/auth.api";
import type { StaffRole } from "../types/staff";

const ROLE_PRIORITY: RoleCode[] = [
  "super_admin",
  "lms_admin",
  "content_manager",
  "teacher",
  "teaching_assistant",
  "student",
];

export const STUDENT_ROLES: RoleCode[] = ["student"];
export const ADMIN_ROLES: RoleCode[] = ["lms_admin", "super_admin"];
export const STAFF_ROLES: RoleCode[] = [
  "teacher",
  "teaching_assistant",
  "content_manager",
  "lms_admin",
  "super_admin",
];
export const APP_ROLES: RoleCode[] = [...STAFF_ROLES, ...STUDENT_ROLES];

export function getPrimaryRole(roles: readonly RoleCode[]): RoleCode | null {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
}

export function getHomePathForRoles(roles: readonly RoleCode[]): string {
  const role = getPrimaryRole(roles);
  if (role === "student") return "/student";
  if (role === "teacher" || role === "teaching_assistant") return "/teacher";
  if (role === "content_manager") return "/content";
  if (role === "lms_admin" || role === "super_admin") return "/admin";
  return "/403";
}

export function getStaffRole(roles: readonly RoleCode[]): StaffRole | null {
  const role = getPrimaryRole(roles);
  if (role === "teacher" || role === "teaching_assistant") return "teacher";
  if (role === "content_manager") return "content-manager";
  if (role === "lms_admin" || role === "super_admin") return "admin";
  return null;
}

export function hasAnyRole(
  userRoles: readonly RoleCode[],
  allowedRoles: readonly RoleCode[],
): boolean {
  return allowedRoles.some((role) => userRoles.includes(role));
}
