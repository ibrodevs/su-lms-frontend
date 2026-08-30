import type { CourseLanguage, CourseStatus, StaffRole } from "../types/staff";

export const courseStatusLabels: Record<CourseStatus, string> = {
  draft: "Черновик",
  "under-review": "На проверке",
  published: "Опубликован",
  archived: "Архив",
};

export const courseLanguageLabels: Record<CourseLanguage, string> = {
  ru: "Русский",
  ky: "Кыргызский",
  en: "English",
};

export const staffRoleLabels: Record<StaffRole, string> = {
  teacher: "Teacher",
  "content-manager": "Content Manager",
  admin: "LMS Admin",
};
