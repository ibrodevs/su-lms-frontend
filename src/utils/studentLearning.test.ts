import { describe, expect, it } from "vitest";
import type { StudentLessonDto } from "../api/student.api";
import { formatFileSize, resolveStudentLessonStatus, translateLockReason } from "./studentLearning";

function createLesson(overrides: Partial<StudentLessonDto> = {}): StudentLessonDto {
  return {
    id: 1,
    title: "Lesson",
    description: "",
    lesson_type: "text",
    content: "Visible content",
    estimated_duration_minutes: 30,
    order: 1,
    release_type: "always",
    release_at: null,
    required_lesson: null,
    status: "not_started",
    is_available: true,
    lock_reason: null,
    materials: [],
    ...overrides,
  };
}

describe("student learning helpers", () => {
  it("trusts the backend availability flag for locked lessons", () => {
    const lesson = createLesson({
      is_available: false,
      content: null,
      lock_reason: "Complete the required lesson.",
      status: "in_progress",
    });

    expect(resolveStudentLessonStatus(lesson)).toBe("locked");
    expect(translateLockReason(lesson.lock_reason)).toBe("Сначала завершите обязательный урок.");
  });

  it("maps backend progress values to the existing UI status", () => {
    expect(resolveStudentLessonStatus(createLesson({ status: "not_started" }))).toBe("not-started");
    expect(resolveStudentLessonStatus(createLesson({ status: "in_progress" }))).toBe("in-progress");
    expect(resolveStudentLessonStatus(createLesson({ status: "completed" }))).toBe("completed");
  });

  it("formats material sizes without changing backend data", () => {
    expect(formatFileSize(null)).toBeNull();
    expect(formatFileSize(900)).toBe("900 Б");
    expect(formatFileSize(1536)).toBe("1.5 КБ");
  });
});
