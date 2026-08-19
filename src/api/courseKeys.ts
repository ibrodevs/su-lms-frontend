import type { CourseListParams } from "./courses.api";

export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  list: (params: CourseListParams) => [...courseKeys.lists(), params] as const,
  details: () => [...courseKeys.all, "detail"] as const,
  detail: (courseId: number) => [...courseKeys.details(), courseId] as const,
  readiness: (courseId: number) => [...courseKeys.detail(courseId), "readiness"] as const,
  history: (courseId: number) => [...courseKeys.detail(courseId), "history"] as const,
};
