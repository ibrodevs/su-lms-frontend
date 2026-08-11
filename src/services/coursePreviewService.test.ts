import { describe, expect, it } from "vitest";
import type { CourseLesson, StaffMaterial } from "../types/staff";
import { buildPreviewLessons } from "./coursePreviewService";

function makeLesson(
  id: string,
  order: number,
  overrides: Partial<CourseLesson> = {},
): CourseLesson {
  return {
    id,
    topicId: "topic-1",
    title: `Урок ${order}`,
    description: "Описание",
    type: "text",
    durationMinutes: 20,
    order,
    available: true,
    releaseCondition: order === 1 ? { type: "always" } : { type: "after-previous" },
    status: "ready",
    content: "Контент",
    videoKind: "none",
    ...overrides,
  };
}

describe("coursePreviewService", () => {
  it("creates completed, available and locked states for a sequential course", () => {
    const lessons = Array.from({ length: 5 }, (_, index) =>
      makeLesson(`lesson-${index + 1}`, index + 1),
    );

    const result = buildPreviewLessons(lessons, [], new Date("2026-08-11T12:00:00Z"));

    expect(result.map((item) => item.status)).toEqual([
      "completed",
      "available",
      "locked",
      "locked",
      "locked",
    ]);
    expect(result[2]?.lockReason).toBe("Завершите предыдущий урок.");
  });

  it("explains hidden, dated and prerequisite locks", () => {
    const lessons = [
      makeLesson("lesson-1", 1),
      makeLesson("lesson-2", 2, { available: false }),
      makeLesson("lesson-3", 3, {
        releaseCondition: { type: "date", availableFrom: "2026-09-01" },
      }),
      makeLesson("lesson-4", 4, {
        status: "draft",
        releaseCondition: { type: "after-lesson", afterLessonId: "lesson-3" },
      }),
    ];

    const result = buildPreviewLessons(lessons, [], new Date("2026-08-11T12:00:00Z"));

    expect(result[1]?.lockReason).toBe("Урок скрыт преподавателем.");
    expect(result[2]?.lockReason).toContain("1 сентября 2026");
    expect(result[3]?.lockReason).toBe("Завершите урок «Урок 3».");
  });

  it("attaches materials to their lesson in display order", () => {
    const materials: StaffMaterial[] = [
      {
        id: "material-2",
        lessonId: "lesson-1",
        title: "Второй",
        description: "",
        type: "pdf",
        order: 2,
        downloadAllowed: true,
        availability: "available",
        createdAt: "2026-08-11T10:00:00Z",
        updatedAt: "2026-08-11T10:00:00Z",
      },
      {
        id: "material-1",
        lessonId: "lesson-1",
        title: "Первый",
        description: "",
        type: "docx",
        order: 1,
        downloadAllowed: true,
        availability: "available",
        createdAt: "2026-08-11T10:00:00Z",
        updatedAt: "2026-08-11T10:00:00Z",
      },
    ];

    const result = buildPreviewLessons([makeLesson("lesson-1", 1)], materials);

    expect(result[0]?.materials.map((material) => material.id)).toEqual([
      "material-1",
      "material-2",
    ]);
  });
});
