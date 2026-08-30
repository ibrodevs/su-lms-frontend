import type { EnrollmentListParams } from "./enrollments.api";

export const enrollmentKeys = {
  all: ["enrollments"] as const,
  course: (courseId: number) => [...enrollmentKeys.all, "course", courseId] as const,
  list: (courseId: number, params: EnrollmentListParams) => [...enrollmentKeys.course(courseId), "list", params] as const,
};
