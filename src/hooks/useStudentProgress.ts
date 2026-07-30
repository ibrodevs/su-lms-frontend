import { useCallback, useSyncExternalStore } from "react";
import type { Lesson } from "../types/student";
import {
  getProgressSnapshot,
  markLessonCompleted,
  markLessonStarted,
  resetStudentProgress,
  subscribeToProgress,
} from "../services/studentProgress";

export function useStudentProgress() {
  const state = useSyncExternalStore(
    subscribeToProgress,
    getProgressSnapshot,
    getProgressSnapshot,
  );

  const startLesson = useCallback((lesson: Lesson) => {
    markLessonStarted(lesson);
  }, []);

  const completeLesson = useCallback((lesson: Lesson) => {
    markLessonCompleted(lesson);
  }, []);

  return {
    state,
    startLesson,
    completeLesson,
    resetProgress: resetStudentProgress,
  };
}
