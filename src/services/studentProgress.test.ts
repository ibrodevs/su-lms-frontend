import { beforeEach, describe, expect, it } from "vitest";
import {
  getCourseById,
  getLessonById,
  getLessonsForCourse,
} from "./studentCatalog";
import {
  getCourseProgress,
  getNextAvailableLesson,
  getProgressSnapshot,
  getResolvedLessonStatus,
  markLessonCompleted,
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

  it("keeps a completed course at one hundred percent", () => {
    const course = requireCourse("kyrgyz-history");

    expect(getCourseProgress(course, getProgressSnapshot())).toMatchObject({
      completed: 1,
      total: 1,
      percent: 100,
      status: "completed",
    });
  });
});
