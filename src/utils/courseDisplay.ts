import type { CourseStatus } from "../api/courses.api";

export const apiCourseStatusLabels: Record<CourseStatus, string> = {
  draft: "Черновик",
  under_review: "На проверке",
  needs_revision: "Нужна доработка",
  published: "Опубликован",
  archived: "Архив",
};
