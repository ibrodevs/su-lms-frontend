import { mockCourseHistory, mockCourses } from "../data/mock/mockCourses";
import type {
  Course,
  CourseFilters,
  CourseHistoryEvent,
  CourseInput,
  CourseReadiness,
  CourseStatus,
  StaffRole,
  StaffStore,
} from "../types/staff";

const STORE_KEY = "su-lms-staff-store-v1";
const STORE_EVENT = "su-lms-staff-store-change";

let memoryStore: StaffStore | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createDefaultStore(): StaffStore {
  return {
    version: 1,
    courses: clone(mockCourses),
    history: clone(mockCourseHistory),
  };
}

function readStore(): StaffStore {
  if (typeof window === "undefined") {
    memoryStore ??= createDefaultStore();
    return clone(memoryStore);
  }

  const raw = window.localStorage.getItem(STORE_KEY);
  if (!raw) {
    const initial = createDefaultStore();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as StaffStore;
    if (parsed.version !== 1 || !Array.isArray(parsed.courses)) throw new Error("Invalid store");
    return parsed;
  } catch {
    const initial = createDefaultStore();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function writeStore(store: StaffStore): void {
  if (typeof window === "undefined") {
    memoryStore = clone(store);
    return;
  }
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(STORE_EVENT));
}

function createId(prefix: string): string {
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomId}`;
}

function addHistory(
  store: StaffStore,
  courseId: string,
  userId: string,
  action: string,
  details?: string,
): CourseHistoryEvent {
  const event: CourseHistoryEvent = {
    id: createId("history"),
    courseId,
    userId,
    action,
    details,
    createdAt: new Date().toISOString(),
  };
  store.history.unshift(event);
  return event;
}

export function getCourses(): Course[] {
  return readStore().courses;
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
  return readStore().history
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

  const store = readStore();
  const now = new Date().toISOString();
  const course: Course = {
    ...input,
    id: createId("course"),
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
  addHistory(store, course.id, userId, "Создан курс");
  writeStore(store);
  return course;
}

export function updateCourse(courseId: string, input: CourseInput, userId: string): Course {
  if (!isCourseCodeUnique(input.code, courseId)) throw new Error("COURSE_CODE_EXISTS");

  const store = readStore();
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
  addHistory(store, courseId, userId, "Обновлена информация курса");
  writeStore(store);
  return updated;
}

export function changeCourseStatus(
  courseId: string,
  status: CourseStatus,
  userId: string,
  details?: string,
): Course {
  const store = readStore();
  const index = store.courses.findIndex((course) => course.id === courseId);
  const existing = store.courses[index];
  if (!existing) throw new Error("COURSE_NOT_FOUND");

  const actionByStatus: Record<CourseStatus, string> = {
    draft: details ? "Курс возвращён на доработку" : "Курс восстановлен как черновик",
    "under-review": "Курс отправлен на проверку",
    published: "Курс опубликован",
    archived: "Курс архивирован",
  };

  const updated: Course = {
    ...existing,
    status,
    reviewComment: status === "draft" ? details : existing.reviewComment,
    publishedAt: status === "published" ? new Date().toISOString() : existing.publishedAt,
    updatedAt: new Date().toISOString(),
    updatedBy: userId,
  };
  store.courses[index] = updated;
  addHistory(store, courseId, userId, actionByStatus[status], details);
  writeStore(store);
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
  return Boolean(
    course.title &&
      course.code &&
      course.description &&
      course.moduleCount > 0 &&
      course.topicCount > 0 &&
      course.lessonCount > 0,
  );
}

export function resetCourseManagementData(): void {
  const initial = createDefaultStore();
  memoryStore = initial;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(initial));
    window.dispatchEvent(new Event(STORE_EVENT));
  }
}

export function subscribeCourseStore(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORE_KEY) listener();
  };
  window.addEventListener(STORE_EVENT, listener);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(STORE_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}
