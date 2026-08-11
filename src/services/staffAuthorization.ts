import { mockStaffUsers } from "../data/mock/mockUsers";
import type { Course, StaffStore } from "../types/staff";

export function canStaffUserAccessCourse(course: Course, userId: string): boolean {
  const actor = mockStaffUsers.find((user) => user.id === userId);
  return Boolean(actor && (actor.role !== "teacher" || course.teacherId === actor.id));
}

export function assertStaffCourseAccess(
  store: StaffStore,
  courseId: string,
  userId: string,
): void {
  const course = store.courses.find((candidate) => candidate.id === courseId);
  if (!course) throw new Error("COURSE_NOT_FOUND");
  if (!canStaffUserAccessCourse(course, userId)) {
    throw new Error("FORBIDDEN_COURSE_ACCESS");
  }
}
