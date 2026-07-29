import { getLessonIdsForCourse, getLessonsForCourse } from "./studentCatalog";
import type {
  Course,
  CourseProgressSummary,
  Lesson,
  LessonProgressRecord,
  ResolvedLessonStatus,
  StudentProgressState,
} from "../types/student";

const STORAGE_KEY = "su-lms:student-progress:v1";
const PROGRESS_EVENT = "su-student-progress-updated";

const initialState: StudentProgressState = {
  version: 1,
  lastLessonId: "dl-security",
  lessons: {
    "dl-intro": {
      lessonId: "dl-intro",
      status: "completed",
      updatedAt: "2026-07-28T08:30:00.000Z",
      completedAt: "2026-07-28T08:30:00.000Z",
    },
    "dl-security": {
      lessonId: "dl-security",
      status: "in-progress",
      updatedAt: "2026-07-29T04:15:00.000Z",
      completedAt: null,
    },
    "kh-nomads": {
      lessonId: "kh-nomads",
      status: "completed",
      updatedAt: "2025-12-18T09:00:00.000Z",
      completedAt: "2025-12-18T09:00:00.000Z",
    },
    "en-speaking": {
      lessonId: "en-speaking",
      status: "in-progress",
      updatedAt: "2026-07-27T07:20:00.000Z",
      completedAt: null,
    },
  },
};

function cloneInitialState(): StudentProgressState {
  return {
    ...initialState,
    lessons: { ...initialState.lessons },
  };
}

function isValidState(value: unknown): value is StudentProgressState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StudentProgressState>;
  return candidate.version === 1 && typeof candidate.lessons === "object";
}

function readStoredState(): StudentProgressState {
  if (typeof window === "undefined") return cloneInitialState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneInitialState();
    const parsed: unknown = JSON.parse(raw);
    return isValidState(parsed) ? parsed : cloneInitialState();
  } catch {
    return cloneInitialState();
  }
}

let currentState = readStoredState();

function emitProgressChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  }
}

function persistState(nextState: StudentProgressState): void {
  currentState = nextState;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // The UI still updates in memory when storage is unavailable or full.
    }
  }

  emitProgressChange();
}

function makeRecord(
  lessonId: string,
  status: LessonProgressRecord["status"],
  previous?: LessonProgressRecord,
): LessonProgressRecord {
  const now = new Date().toISOString();
  return {
    lessonId,
    status,
    updatedAt: now,
    completedAt: status === "completed" ? now : previous?.completedAt ?? null,
  };
}

export function getProgressSnapshot(): StudentProgressState {
  return currentState;
}

export function subscribeToProgress(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      currentState = readStoredState();
      onStoreChange();
    }
  };

  window.addEventListener(PROGRESS_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(PROGRESS_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function isLessonLocked(
  lesson: Lesson,
  state: StudentProgressState = currentState,
): boolean {
  if (!lesson.requiresLessonId) return false;
  return state.lessons[lesson.requiresLessonId]?.status !== "completed";
}

export function getResolvedLessonStatus(
  lesson: Lesson,
  state: StudentProgressState = currentState,
): ResolvedLessonStatus {
  if (isLessonLocked(lesson, state)) return "locked";
  return state.lessons[lesson.id]?.status ?? "not-started";
}

export function markLessonStarted(lesson: Lesson): void {
  if (isLessonLocked(lesson, currentState)) return;

  const previous = currentState.lessons[lesson.id];
  const nextRecord =
    previous?.status === "completed"
      ? {
          ...previous,
          updatedAt: new Date().toISOString(),
        }
      : makeRecord(lesson.id, "in-progress", previous);

  persistState({
    ...currentState,
    lastLessonId: lesson.id,
    lessons: {
      ...currentState.lessons,
      [lesson.id]: nextRecord,
    },
  });
}

export function markLessonCompleted(lesson: Lesson): void {
  if (isLessonLocked(lesson, currentState)) return;

  persistState({
    ...currentState,
    lastLessonId: lesson.id,
    lessons: {
      ...currentState.lessons,
      [lesson.id]: makeRecord(
        lesson.id,
        "completed",
        currentState.lessons[lesson.id],
      ),
    },
  });
}

export function getCourseProgress(
  course: Course,
  state: StudentProgressState = currentState,
): CourseProgressSummary {
  const lessons = getLessonsForCourse(course);
  const completed = lessons.filter(
    (lesson) => state.lessons[lesson.id]?.status === "completed",
  ).length;
  const activeLesson = lessons.find(
    (lesson) => state.lessons[lesson.id]?.status === "in-progress",
  );
  const lastOpenedLesson = lessons.reduce<Lesson | null>(
    (latestLesson, lesson) => {
      const record = state.lessons[lesson.id];
      if (!record) return latestLesson;

      const latestRecord = latestLesson
        ? state.lessons[latestLesson.id]
        : undefined;
      return !latestRecord || record.updatedAt > latestRecord.updatedAt
        ? lesson
        : latestLesson;
    },
    null,
  );
  const continuationLesson = getNextAvailableLesson(course, state);
  const percent = lessons.length
    ? Math.round((completed / lessons.length) * 100)
    : 0;
  const status =
    percent === 100
      ? "completed"
      : completed > 0 || activeLesson
        ? "in-progress"
        : course.initialStatus;

  return {
    completed,
    total: lessons.length,
    percent,
    status,
    continuationLessonId: activeLesson?.id ?? continuationLesson?.id ?? null,
    lastOpenedLessonId: lastOpenedLesson?.id ?? null,
  };
}

export function getNextAvailableLesson(
  course: Course,
  state: StudentProgressState = currentState,
): Lesson | null {
  const lessonIds = getLessonIdsForCourse(course);
  const lessons = getLessonsForCourse(course);
  const lastLessonIndex = state.lastLessonId
    ? lessonIds.indexOf(state.lastLessonId)
    : -1;
  const lastLesson = lastLessonIndex >= 0 ? lessons[lastLessonIndex] : undefined;

  if (
    lastLesson &&
    getResolvedLessonStatus(lastLesson, state) !== "completed" &&
    !isLessonLocked(lastLesson, state)
  ) {
    return lastLesson;
  }

  return (
    lessons.find(
      (lesson) =>
        getResolvedLessonStatus(lesson, state) !== "completed" &&
        !isLessonLocked(lesson, state),
    ) ?? null
  );
}

export function resetStudentProgress(): void {
  persistState(cloneInitialState());
}
