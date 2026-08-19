import type {
  StudentCourseDetailDto,
  StudentLessonDto,
  StudentModuleDto,
  StudentTopicDto,
} from "../api/student.api";
import type { ResolvedLessonStatus } from "../types/student";

export interface StudentLessonContext {
  lesson: StudentLessonDto;
  module: StudentModuleDto;
  topic: StudentTopicDto;
}

export function resolveStudentLessonStatus(lesson: StudentLessonDto): ResolvedLessonStatus {
  if (!lesson.is_available) return "locked";
  if (lesson.status === "in_progress") return "in-progress";
  if (lesson.status === "completed") return "completed";
  return "not-started";
}

export function flattenStudentLessons(course: StudentCourseDetailDto): StudentLessonContext[] {
  return course.structure.flatMap((module) =>
    module.topics.flatMap((topic) =>
      topic.lessons.map((lesson) => ({ lesson, module, topic })),
    ),
  );
}

export function findStudentLessonContext(
  course: StudentCourseDetailDto,
  lessonId: number,
): StudentLessonContext | undefined {
  return flattenStudentLessons(course).find(({ lesson }) => lesson.id === lessonId);
}

export function formatFileSize(size: number | null): string | null {
  if (size === null) return null;
  if (size < 1024) return `${size} Б`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / 1024 ** 2).toFixed(1)} МБ`;
}

export function translateLockReason(reason: string | null): string {
  const labels: Record<string, string> = {
    "Lesson is not published.": "Урок ещё не опубликован.",
    "This module is not available yet.": "Модуль ещё не открыт.",
    "Complete the previous module.": "Сначала завершите предыдущий модуль.",
    "This lesson is not available yet.": "Урок ещё не открыт.",
    "Complete the required lesson.": "Сначала завершите обязательный урок.",
    "Complete the previous lesson.": "Сначала завершите предыдущий урок.",
  };
  return reason ? labels[reason] ?? reason : "Урок пока недоступен.";
}
