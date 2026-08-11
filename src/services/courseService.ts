import type {
  Course,
  CourseFilters,
  CourseHistoryEvent,
  CourseInput,
  CourseReadiness,
  CourseStatus,
  StaffRole,
} from "../types/staff";
import { mockStaffUsers } from "../data/mock/mockUsers";
import {
  appendCourseHistory,
  createStaffId,
  readStaffStore,
  resetStaffStore,
  subscribeStaffStore,
  writeStaffStore,
} from "./staffStore";

export interface CourseReviewIssue {
  id: string;
  message: string;
}

const lifecycleTransitions: Record<CourseStatus, CourseStatus[]> = {
  draft: ["under-review"],
  "under-review": ["draft", "published"],
  published: ["archived"],
  archived: ["draft"],
};

export function getCourses(): Course[] {
  return readStaffStore().courses;
}

export function getVisibleCourses(role: StaffRole, userId: string): Course[] {
  const courses = getCourses();
  return role === "teacher"
    ? courses.filter((course) => course.teacherId === userId)
    : courses;
}

export function getCourse(courseId: string): Course | null {
  return getCourses().find((course) => course.id === courseId) ?? null;
}

export function getCourseHistory(courseId: string): CourseHistoryEvent[] {
  return readStaffStore().history
    .filter((event) => event.courseId === courseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function isCourseCodeUnique(code: string, ignoredCourseId?: string): boolean {
  const normalizedCode = code.trim().toLowerCase();
  return !getCourses().some(
    (course) =>
      course.id !== ignoredCourseId && course.code.toLowerCase() === normalizedCode,
  );
}

export function createCourse(input: CourseInput, userId: string): Course {
  if (!isCourseCodeUnique(input.code)) throw new Error("COURSE_CODE_EXISTS");

  const store = readStaffStore();
  const now = new Date().toISOString();
  const course: Course = {
    ...input,
    id: createStaffId("course"),
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    description: input.description.trim(),
    status: "draft",
    moduleCount: 0,
    topicCount: 0,
    lessonCount: 0,
    materialCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
  };
  store.courses.unshift(course);
  appendCourseHistory(store, course.id, userId, "Создан курс");
  writeStaffStore(store);
  return course;
}

export function updateCourse(courseId: string, input: CourseInput, userId: string): Course {
  if (!isCourseCodeUnique(input.code, courseId)) throw new Error("COURSE_CODE_EXISTS");

  const store = readStaffStore();
  const index = store.courses.findIndex((course) => course.id === courseId);
  const existing = store.courses[index];
  if (!existing) throw new Error("COURSE_NOT_FOUND");

  const updated: Course = {
    ...existing,
    ...input,
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    description: input.description.trim(),
    updatedAt: new Date().toISOString(),
    updatedBy: userId,
  };
  store.courses[index] = updated;
  appendCourseHistory(store, courseId, userId, "Обновлена информация курса");
  writeStaffStore(store);
  return updated;
}

export function changeCourseStatus(
  courseId: string,
  status: CourseStatus,
  userId: string,
  details?: string,
): Course {
  const store = readStaffStore();
  const index = store.courses.findIndex((course) => course.id === courseId);
  const existing = store.courses[index];
  if (!existing) throw new Error("COURSE_NOT_FOUND");
  const actor = mockStaffUsers.find((user) => user.id === userId);
  if (!actor) throw new Error("STAFF_USER_NOT_FOUND");
  if (!lifecycleTransitions[existing.status].includes(status)) {
    throw new Error("INVALID_STATUS_TRANSITION");
  }
  const canReview = actor.role === "content-manager" || actor.role === "admin";
  if (existing.status === "draft" && status === "under-review") {
    if (!canSubmitForReview(existing)) throw new Error("COURSE_NOT_READY");
  } else if (!canReview) {
    throw new Error("FORBIDDEN_STATUS_TRANSITION");
  }
  if (existing.status === "under-review" && status === "draft" && !details?.trim()) {
    throw new Error("REVIEW_COMMENT_REQUIRED");
  }

  const actionByStatus: Record<CourseStatus, string> = {
    draft: details ? "Курс возвращён на доработку" : "Курс восстановлен как черновик",
    "under-review": "Курс отправлен на проверку",
    published: "Курс опубликован",
    archived: "Курс архивирован",
  };

  const updated: Course = {
    ...existing,
    status,
    reviewComment:
      status === "draft"
        ? details?.trim()
        : status === "under-review"
          ? undefined
          : existing.reviewComment,
    publishedAt: status === "published" ? new Date().toISOString() : existing.publishedAt,
    updatedAt: new Date().toISOString(),
    updatedBy: userId,
  };
  store.courses[index] = updated;
  appendCourseHistory(store, courseId, userId, actionByStatus[status], details);
  writeStaffStore(store);
  return updated;
}

export function filterCourses(courses: Course[], filters: CourseFilters): Course[] {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const filtered = courses.filter((course) => {
    if (
      normalizedQuery &&
      !`${course.title} ${course.code}`.toLowerCase().includes(normalizedQuery)
    ) return false;
    if (filters.status !== "all" && course.status !== filters.status) return false;
    if (filters.semesterId && course.semesterId !== filters.semesterId) return false;
    if (filters.facultyId && course.facultyId !== filters.facultyId) return false;
    if (filters.departmentId && course.departmentId !== filters.departmentId) return false;
    if (filters.programId && course.programId !== filters.programId) return false;
    if (filters.teacherId && course.teacherId !== filters.teacherId) return false;
    if (filters.language !== "all" && course.language !== filters.language) return false;
    return true;
  });

  return filtered.sort((left, right) => {
    const leftValue = String(left[filters.sortBy]).toLowerCase();
    const rightValue = String(right[filters.sortBy]).toLowerCase();
    const comparison = leftValue.localeCompare(rightValue, "ru");
    return filters.sortDirection === "asc" ? comparison : -comparison;
  });
}

export function getCourseReadiness(course: Course): CourseReadiness {
  const items = [
    { label: "Основная информация", complete: Boolean(course.title && course.description && course.code) },
    { label: "Обложка", complete: Boolean(course.coverName || course.coverDataUrl) },
    { label: "Syllabus", complete: Boolean(course.syllabusName) },
    { label: "Модули", complete: course.moduleCount > 0 },
    { label: "Темы", complete: course.topicCount > 0 },
    { label: "Уроки", complete: course.lessonCount > 0 },
    { label: "Материалы уроков", complete: course.materialCount > 0 },
  ];
  const completeCount = items.filter((item) => item.complete).length;
  return { items, percentage: Math.round((completeCount / items.length) * 100) };
}

export function canSubmitForReview(course: Course): boolean {
  return getCourseReviewIssues(course.id).length === 0;
}

export function getCourseReviewIssues(courseId: string): CourseReviewIssue[] {
  const store = readStaffStore();
  const course = store.courses.find((item) => item.id === courseId);
  if (!course) return [{ id: "course", message: "Курс не найден." }];

  const issues: CourseReviewIssue[] = [];
  const hasMetadata = Boolean(
    course.title.trim() &&
      course.code.trim() &&
      course.description.trim() &&
      course.facultyId &&
      course.departmentId &&
      course.programId &&
      course.semesterId &&
      course.teacherId &&
      course.startDate &&
      course.endDate &&
      course.credits > 0,
  );
  if (!hasMetadata) {
    issues.push({ id: "metadata", message: "Заполните основную информацию курса." });
  }
  if (!course.coverName && !course.coverDataUrl) {
    issues.push({ id: "cover", message: "Добавьте обложку курса." });
  }
  if (!course.syllabusName) {
    issues.push({ id: "syllabus", message: "Загрузите syllabus в формате PDF или DOCX." });
  }

  const modules = store.modules
    .filter((module) => module.courseId === course.id)
    .sort((left, right) => left.order - right.order);
  if (!modules.length) {
    issues.push({ id: "modules", message: "Добавьте хотя бы один модуль." });
    return issues;
  }

  for (const module of modules) {
    const topics = store.topics.filter((topic) => topic.moduleId === module.id);
    if (!topics.length) {
      issues.push({
        id: `module-topics-${module.id}`,
        message: `Модуль «${module.title}» не содержит тем.`,
      });
    }
    const topicIds = new Set(topics.map((topic) => topic.id));
    const lessonCount = store.lessons.filter((lesson) => topicIds.has(lesson.topicId)).length;
    if (!lessonCount) {
      issues.push({
        id: `module-lessons-${module.id}`,
        message: `Модуль «${module.title}» не содержит уроков.`,
      });
    }
  }

  return issues;
}

export function resetCourseManagementData(): void {
  resetStaffStore();
}

export function subscribeCourseStore(listener: () => void): () => void {
  return subscribeStaffStore(listener);
}
