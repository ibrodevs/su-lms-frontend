import { describe, expect, it } from "vitest";
import { mockAssignments } from "./mockAssignments";
import { mockCalendarEvents } from "./mockCalendar";
import { mockCourses } from "./mockCourses";
import { mockLessons } from "./mockLessons";
import { mockMaterials } from "./mockMaterials";
import { mockNotifications } from "./mockNotifications";
import { mockSchedule } from "./mockSchedule";
import { mockTests } from "./mockTests";

describe("Release 1 mock catalogue", () => {
  it("contains the minimum dataset required by the specification", () => {
    expect(mockCourses.length).toBeGreaterThanOrEqual(8);
    expect(mockLessons.length).toBeGreaterThanOrEqual(50);
    expect(mockMaterials.length).toBeGreaterThanOrEqual(25);
    expect(mockAssignments.length).toBeGreaterThanOrEqual(12);
    expect(mockTests.length).toBeGreaterThanOrEqual(8);
    expect(mockCalendarEvents.length).toBeGreaterThanOrEqual(30);
    expect(mockSchedule.length).toBeGreaterThanOrEqual(20);
    expect(mockNotifications.length).toBeGreaterThanOrEqual(25);
  });

  it("keeps course and lesson relationships valid", () => {
    const courseIds = new Set(mockCourses.map((course) => course.id));
    const lessonIds = new Set(mockLessons.map((lesson) => lesson.id));
    const materialIds = new Set(mockMaterials.map((material) => material.id));

    expect(mockLessons.every((lesson) => courseIds.has(lesson.courseId))).toBe(true);
    expect(mockCourses.every((course) => course.modules.every((module) => module.topics.every((topic) => topic.lessonIds.every((lessonId) => lessonIds.has(lessonId)))))).toBe(true);
    expect(mockCourses.every((course) => course.materialIds.every((materialId) => materialIds.has(materialId)))).toBe(true);
    expect(mockLessons.every((lesson) => lesson.materialIds.every((materialId) => materialIds.has(materialId)))).toBe(true);
    expect(mockMaterials.every((material) => courseIds.has(material.courseId))).toBe(true);
    expect(mockMaterials.every((material) => !material.lessonId || lessonIds.has(material.lessonId))).toBe(true);
  });

  it("keeps learning tools linked to existing courses", () => {
    const courseIds = new Set(mockCourses.map((course) => course.id));

    expect(mockAssignments.every((assignment) => courseIds.has(assignment.courseId))).toBe(true);
    expect(mockTests.every((test) => courseIds.has(test.courseId))).toBe(true);
    expect(mockSchedule.every((item) => courseIds.has(item.courseId))).toBe(true);
    expect(mockNotifications.every((notification) => !notification.target || notification.target.startsWith("/student"))).toBe(true);
  });

  it("keeps test answer keys consistent with question options", () => {
    for (const test of mockTests) {
      expect(test.questions.length).toBeGreaterThan(0);
      expect(test.passingScore).toBeGreaterThanOrEqual(0);
      expect(test.passingScore).toBeLessThanOrEqual(100);

      for (const question of test.questions) {
        if (question.type === "text") {
          expect(question.correctText?.trim()).toBeTruthy();
          continue;
        }

        const options = question.options ?? [];
        expect(options.length).toBeGreaterThan(0);
        expect(
          (question.correctOptionIds ?? []).every((optionId) => {
            const optionIndex = Number(optionId);
            return Number.isInteger(optionIndex) && optionIndex >= 0 && optionIndex < options.length;
          }),
        ).toBe(true);
      }
    }
  });
});
