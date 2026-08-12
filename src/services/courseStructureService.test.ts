import { beforeEach, describe, expect, it } from "vitest";
import type { CourseInput, LessonInput, ModuleInput } from "../types/staff";
import { createCourse, getCourse, getCourseHistory, resetCourseManagementData } from "./courseService";
import {
  createLesson,
  createModule,
  createTopic,
  deleteModule,
  deleteLesson,
  deleteTopic,
  duplicateModule,
  duplicateTopic,
  getCourseStructure,
  moveLesson,
  moveModule,
  updateLesson,
  updateModule,
  updateTopic,
} from "./courseStructureService";

const userId = "teacher-1";

const courseInput: CourseInput = {
  title: "Тестовый Course Builder",
  code: "CB101",
  description: "Курс для проверки структуры.",
  language: "ru",
  credits: 4,
  facultyId: "faculty-digital",
  departmentId: "department-software",
  programId: "program-software",
  semesterId: "semester-fall-2026",
  teacherId: userId,
  startDate: "2026-09-01",
  endDate: "2026-12-24",
};

const moduleInput: ModuleInput = {
  title: "Первый модуль",
  description: "Описание модуля",
  releaseCondition: { type: "always" },
};

const lessonInput: LessonInput = {
  title: "Первый урок",
  description: "Описание урока",
  type: "mixed",
  durationMinutes: 35,
  available: true,
  releaseCondition: { type: "always" },
  status: "ready",
  content: "## Тестовый урок",
  videoKind: "none",
};

function createEmptyCourse() {
  return createCourse(courseInput, userId);
}

describe("courseStructureService", () => {
  beforeEach(() => resetCourseManagementData());

  it("creates a linked module, topic and lesson and updates course aggregates", () => {
    const course = createEmptyCourse();
    const module = createModule(course.id, moduleInput, userId);
    const topic = createTopic(module.id, { title: "Компоненты", description: "Основы" }, userId);
    const lesson = createLesson(topic.id, lessonInput, userId);
    const structure = getCourseStructure(course.id);

    expect(structure.modules).toEqual([expect.objectContaining({ id: module.id, order: 1 })]);
    expect(structure.topics).toEqual([expect.objectContaining({ id: topic.id, moduleId: module.id })]);
    expect(structure.lessons).toEqual([expect.objectContaining({ id: lesson.id, topicId: topic.id })]);
    expect(getCourse(course.id)).toMatchObject({ moduleCount: 1, topicCount: 1, lessonCount: 1, updatedBy: userId });
  });

  it("persists edits and every supported release condition", () => {
    const course = createEmptyCourse();
    const module = createModule(course.id, moduleInput, userId);
    const topic = createTopic(module.id, { title: "Тема", description: "" }, userId);
    const firstLesson = createLesson(topic.id, lessonInput, userId);
    const secondLesson = createLesson(topic.id, { ...lessonInput, title: "Второй урок", releaseCondition: { type: "after-previous" } }, userId);

    updateModule(module.id, { ...moduleInput, title: "Обновлённый модуль", releaseCondition: { type: "date", availableFrom: "2026-10-05" } }, userId);
    updateTopic(topic.id, { title: "Обновлённая тема", description: "Новое описание" }, userId);
    updateLesson(secondLesson.id, { ...lessonInput, title: "Урок по условию", releaseCondition: { type: "after-lesson", afterLessonId: firstLesson.id } }, userId);
    const structure = getCourseStructure(course.id);

    expect(structure.modules[0]?.releaseCondition).toEqual({ type: "date", availableFrom: "2026-10-05" });
    expect(structure.topics[0]?.title).toBe("Обновлённая тема");
    expect(structure.lessons[1]?.releaseCondition).toEqual({ type: "after-lesson", afterLessonId: firstLesson.id });
  });

  it("reorders siblings without breaking their sequential positions", () => {
    const course = createEmptyCourse();
    const firstModule = createModule(course.id, moduleInput, userId);
    const secondModule = createModule(course.id, { ...moduleInput, title: "Второй модуль" }, userId);
    const topic = createTopic(firstModule.id, { title: "Тема", description: "" }, userId);
    const firstLesson = createLesson(topic.id, lessonInput, userId);
    const secondLesson = createLesson(topic.id, { ...lessonInput, title: "Второй урок" }, userId);

    expect(moveModule(secondModule.id, "up", userId)).toBe(true);
    expect(moveModule(secondModule.id, "up", userId)).toBe(false);
    expect(moveLesson(secondLesson.id, "up", userId)).toBe(true);
    const structure = getCourseStructure(course.id);

    expect(structure.modules.map((item) => item.id)).toEqual([secondModule.id, firstModule.id]);
    expect(structure.modules.map((item) => item.order)).toEqual([1, 2]);
    expect(structure.lessons.map((item) => item.id)).toEqual([secondLesson.id, firstLesson.id]);
  });

  it("duplicates nested content and remaps internal lesson dependencies", () => {
    const course = createEmptyCourse();
    const module = createModule(course.id, moduleInput, userId);
    const topic = createTopic(module.id, { title: "Тема", description: "" }, userId);
    const firstLesson = createLesson(topic.id, lessonInput, userId);
    createLesson(topic.id, { ...lessonInput, title: "Зависимый урок", releaseCondition: { type: "after-lesson", afterLessonId: firstLesson.id } }, userId);

    const copiedModule = duplicateModule(module.id, userId);
    const structure = getCourseStructure(course.id);
    const copiedTopic = structure.topics.find((item) => item.moduleId === copiedModule.id);
    const copiedLessons = structure.lessons.filter((item) => item.topicId === copiedTopic?.id);

    expect(copiedTopic).toBeTruthy();
    expect(copiedLessons).toHaveLength(2);
    expect(copiedLessons[1]?.releaseCondition.afterLessonId).toBe(copiedLessons[0]?.id);

    const secondTopicCopy = duplicateTopic(topic.id, userId);
    expect(getCourseStructure(course.id).lessons.filter((item) => item.topicId === secondTopicCopy.id)).toHaveLength(2);
  });

  it("cascades deletes, normalizes order and records history", () => {
    const course = createEmptyCourse();
    const module = createModule(course.id, moduleInput, userId);
    const firstTopic = createTopic(module.id, { title: "Первая тема", description: "" }, userId);
    const secondTopic = createTopic(module.id, { title: "Вторая тема", description: "" }, userId);
    createLesson(firstTopic.id, lessonInput, userId);
    createLesson(secondTopic.id, { ...lessonInput, title: "Сохраняемый урок" }, userId);

    deleteTopic(firstTopic.id, userId);
    expect(getCourseStructure(course.id).topics).toEqual([expect.objectContaining({ id: secondTopic.id, order: 1 })]);
    expect(getCourse(course.id)).toMatchObject({ moduleCount: 1, topicCount: 1, lessonCount: 1 });

    deleteModule(module.id, userId);
    expect(getCourseStructure(course.id)).toEqual({ modules: [], topics: [], lessons: [] });
    expect(getCourseHistory(course.id).map((event) => event.action)).toEqual(expect.arrayContaining(["Удалена тема", "Удалён модуль"]));
  });

  it("clears release dependencies when their lesson is deleted", () => {
    const course = createEmptyCourse();
    const module = createModule(course.id, moduleInput, userId);
    const topic = createTopic(module.id, { title: "Тема", description: "" }, userId);
    const firstLesson = createLesson(topic.id, lessonInput, userId);
    const secondLesson = createLesson(topic.id, { ...lessonInput, title: "Зависимый урок", releaseCondition: { type: "after-lesson", afterLessonId: firstLesson.id } }, userId);

    deleteLesson(firstLesson.id, userId);

    expect(getCourseStructure(course.id).lessons.find((lesson) => lesson.id === secondLesson.id)?.releaseCondition).toEqual({ type: "after-previous" });
  });
});
