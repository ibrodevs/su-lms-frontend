import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCourseById,
  getLessonById,
  getLessonsForCourse,
  mockMaterials,
} from "./studentCatalog";
import {
  getCourseProgress,
  getNextAvailableLesson,
  getProgressSnapshot,
  getResolvedLessonStatus,
  markLessonCompleted,
  markLessonStarted,
  resetStudentProgress,
} from "./studentProgress";

function requireCourse(courseId: string) {
  const course = getCourseById(courseId);
  if (!course) throw new Error(`Missing course: ${courseId}`);
  return course;
}

function requireLesson(lessonId: string) {
  const lesson = getLessonById(lessonId);
  if (!lesson) throw new Error(`Missing lesson: ${lessonId}`);
  return lesson;
}

describe("student progress service", () => {
  beforeEach(() => {
    resetStudentProgress();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds the main course from eight ordered lessons", () => {
    const course = requireCourse("digital-literacy");

    expect(getLessonsForCourse(course)).toHaveLength(8);
  });

  it("locks a lesson until its prerequisite is completed", () => {
    const securityLesson = requireLesson("dl-security");
    const filesLesson = requireLesson("dl-files");

    expect(
      getResolvedLessonStatus(filesLesson, getProgressSnapshot()),
    ).toBe("locked");

    markLessonCompleted(securityLesson);

    expect(
      getResolvedLessonStatus(filesLesson, getProgressSnapshot()),
    ).toBe("not-started");
  });

  it("calculates course progress from completed lessons", () => {
    const course = requireCourse("digital-literacy");
    const progress = getCourseProgress(course, getProgressSnapshot());

    expect(progress).toMatchObject({
      completed: 1,
      total: 8,
      percent: 13,
      status: "in-progress",
    });
  });

  it("returns the last active lesson as the continuation target", () => {
    const course = requireCourse("digital-literacy");

    expect(getNextAvailableLesson(course, getProgressSnapshot())?.id).toBe(
      "dl-security",
    );
  });

  it("continues with the next unlocked lesson after completing the active lesson", () => {
    const course = requireCourse("digital-literacy");
    const securityLesson = requireLesson("dl-security");

    markLessonCompleted(securityLesson);

    const state = getProgressSnapshot();
    expect(state.lastLessonId).toBe("dl-security");
    expect(getNextAvailableLesson(course, state)?.id).toBe("dl-files");
    expect(getCourseProgress(course, state)).toMatchObject({
      continuationLessonId: "dl-files",
      lastOpenedLessonId: "dl-security",
    });
  });

  it("tracks a reopened completed lesson without resetting its completion", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30T10:00:00.000Z"));

    const course = requireCourse("digital-literacy");
    const completedLesson = requireLesson("dl-intro");
    const completedAt =
      getProgressSnapshot().lessons[completedLesson.id]?.completedAt;

    markLessonStarted(completedLesson);

    const state = getProgressSnapshot();
    expect(state.lastLessonId).toBe("dl-intro");
    expect(state.lessons["dl-intro"]).toMatchObject({
      status: "completed",
      completedAt,
      updatedAt: "2026-07-30T10:00:00.000Z",
    });
    expect(getCourseProgress(course, state)).toMatchObject({
      continuationLessonId: "dl-security",
      lastOpenedLessonId: "dl-intro",
    });
  });

  it("keeps a completed course at one hundred percent", () => {
    const course = requireCourse("kyrgyz-history");

    expect(getCourseProgress(course, getProgressSnapshot())).toMatchObject({
      completed: 1,
      total: 1,
      percent: 100,
      status: "completed",
    });
  });

  it("keeps every course lesson linked to an existing module", () => {
    const course = requireCourse("digital-literacy");
    const moduleIds = new Set(course.modules.map((module) => module.id));

    for (const lesson of getLessonsForCourse(course)) {
      expect(moduleIds.has(lesson.moduleId)).toBe(true);
    }
  });

  it("provides a file URL for every available office document", () => {
    const availableOfficeDocuments = mockMaterials.filter(
      (material) =>
        material.availability === "available" &&
        (material.type === "docx" || material.type === "pptx"),
    );

    expect(availableOfficeDocuments.length).toBeGreaterThan(0);
    for (const material of availableOfficeDocuments) {
      expect(material.url).toMatch(/^\/materials\/.+\.(docx|pptx)$/);
    }
  });

  it("includes an explicit unsupported material state", () => {
    const unsupportedMaterial = mockMaterials.find(
      (material) => material.availability === "unsupported",
    );

    expect(unsupportedMaterial).toMatchObject({
      id: "dl-legacy-archive",
      type: "other",
      availability: "unsupported",
    });
    expect(requireLesson("dl-files").materialIds).toContain(
      "dl-legacy-archive",
    );
  });
});
