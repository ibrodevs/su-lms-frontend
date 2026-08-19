import type { StudentCourseListParams } from "./student.api";

export const studentKeys = {
  all: ["student"] as const,
  dashboard: () => [...studentKeys.all, "dashboard"] as const,
  courseLists: () => [...studentKeys.all, "courses"] as const,
  courses: (params: StudentCourseListParams) => [...studentKeys.courseLists(), params] as const,
  progress: () => [...studentKeys.all, "progress"] as const,
};
