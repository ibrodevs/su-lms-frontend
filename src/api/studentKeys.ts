import type { StudentCourseListParams } from "./student.api";

export const studentKeys = {
  all: ["student"] as const,
  dashboard: () => [...studentKeys.all, "dashboard"] as const,
  courseLists: () => [...studentKeys.all, "courses"] as const,
  courses: (params: StudentCourseListParams) => [...studentKeys.courseLists(), params] as const,
  courseDetails: () => [...studentKeys.all, "course"] as const,
  course: (courseId: number) => [...studentKeys.courseDetails(), courseId] as const,
  lessons: () => [...studentKeys.all, "lesson"] as const,
  lesson: (lessonId: number) => [...studentKeys.lessons(), lessonId] as const,
  progress: () => [...studentKeys.all, "progress"] as const,
  courseProgress: (courseId: number) => [...studentKeys.progress(), "course", courseId] as const,
};
