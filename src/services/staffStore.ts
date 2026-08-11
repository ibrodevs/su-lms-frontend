import { mockCourseHistory, mockCourses } from "../data/mock/mockCourses";
import { mockLessons, mockModules, mockTopics } from "../data/mock/mockStructure";
import type { CourseHistoryEvent, StaffStore } from "../types/staff";

const STORE_KEY = "su-lms-staff-store-v1";
const STORE_EVENT = "su-lms-staff-store-change";

interface LegacyStaffStore {
  version: 1;
  courses: StaffStore["courses"];
  history: StaffStore["history"];
}

let memoryStore: StaffStore | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createDefaultStaffStore(): StaffStore {
  return {
    version: 2,
    courses: clone(mockCourses),
    history: clone(mockCourseHistory),
    modules: clone(mockModules),
    topics: clone(mockTopics),
    lessons: clone(mockLessons),
  };
}

function migrateLegacyStore(legacy: LegacyStaffStore): StaffStore {
  const courseIds = new Set(legacy.courses.map((course) => course.id));
  const modules = mockModules.filter((module) => courseIds.has(module.courseId));
  const moduleIds = new Set(modules.map((module) => module.id));
  const topics = mockTopics.filter((topic) => moduleIds.has(topic.moduleId));
  const topicIds = new Set(topics.map((topic) => topic.id));
  const lessons = mockLessons.filter((lesson) => topicIds.has(lesson.topicId));

  return {
    version: 2,
    courses: legacy.courses,
    history: legacy.history,
    modules: clone(modules),
    topics: clone(topics),
    lessons: clone(lessons),
  };
}

export function readStaffStore(): StaffStore {
  if (typeof window === "undefined") {
    memoryStore ??= createDefaultStaffStore();
    return clone(memoryStore);
  }

  const raw = window.localStorage.getItem(STORE_KEY);
  if (!raw) {
    const initial = createDefaultStaffStore();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as StaffStore | LegacyStaffStore;
    if (parsed.version === 1 && Array.isArray(parsed.courses)) {
      const migrated = migrateLegacyStore(parsed);
      window.localStorage.setItem(STORE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    if (
      parsed.version !== 2 ||
      !Array.isArray(parsed.courses) ||
      !Array.isArray(parsed.modules) ||
      !Array.isArray(parsed.topics) ||
      !Array.isArray(parsed.lessons)
    ) {
      throw new Error("Invalid store");
    }
    return parsed;
  } catch {
    const initial = createDefaultStaffStore();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(initial));
    return initial;
  }
}

export function writeStaffStore(store: StaffStore): void {
  if (typeof window === "undefined") {
    memoryStore = clone(store);
    return;
  }
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(STORE_EVENT));
}

export function createStaffId(prefix: string): string {
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomId}`;
}

export function appendCourseHistory(
  store: StaffStore,
  courseId: string,
  userId: string,
  action: string,
  details?: string,
): CourseHistoryEvent {
  const event: CourseHistoryEvent = {
    id: createStaffId("history"),
    courseId,
    userId,
    action,
    details,
    createdAt: new Date().toISOString(),
  };
  store.history.unshift(event);
  return event;
}

export function updateCourseAggregates(
  store: StaffStore,
  courseId: string,
  userId: string,
): void {
  const courseIndex = store.courses.findIndex((course) => course.id === courseId);
  const course = store.courses[courseIndex];
  if (!course) return;

  const modules = store.modules.filter((module) => module.courseId === courseId);
  const moduleIds = new Set(modules.map((module) => module.id));
  const topics = store.topics.filter((topic) => moduleIds.has(topic.moduleId));
  const topicIds = new Set(topics.map((topic) => topic.id));
  const lessons = store.lessons.filter((lesson) => topicIds.has(lesson.topicId));

  store.courses[courseIndex] = {
    ...course,
    moduleCount: modules.length,
    topicCount: topics.length,
    lessonCount: lessons.length,
    updatedAt: new Date().toISOString(),
    updatedBy: userId,
  };
}

export function resetStaffStore(): void {
  const initial = createDefaultStaffStore();
  memoryStore = initial;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(initial));
    window.dispatchEvent(new Event(STORE_EVENT));
  }
}

export function subscribeStaffStore(listener: () => void): () => void {
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
