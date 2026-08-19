import type { StudentCourseProgressDto } from "../../api/student.api";
import type { CourseStatus } from "../../types/student";

export function resolveStudentCourseStatus(progress?: StudentCourseProgressDto): CourseStatus {
  if (!progress || progress.progress_percent === 0) return "not-started";
  if (progress.progress_percent >= 100) return "completed";
  return "in-progress";
}
