import { beforeEach, describe, expect, it } from "vitest";
import type { CourseInput, LessonInput, MaterialInput, ModuleInput } from "../types/staff";
import { createCourse, getCourse, getCourseHistory, resetCourseManagementData } from "./courseService";
import { createLesson, createModule, createTopic, deleteLesson, deleteModule, duplicateLesson } from "./courseStructureService";
import {
  createMaterial,
  deleteMaterial,
  duplicateMaterial,
  getAllMaterials,
  getCourseMaterials,
  getMaterial,
  getMaterialsForLesson,
  moveMaterial,
  updateMaterial,
} from "./materialService";

const userId = "teacher-1";

const courseInput: CourseInput = {
  title: "Материалы курса",
  code: "MAT101",
  description: "Курс для regression-тестов материалов.",
  language: "ru",
  credits: 3,
  facultyId: "faculty-digital",
  departmentId: "department-software",
  programId: "program-software",
  semesterId: "semester-fall-2026",
  teacherId: userId,
  startDate: "2026-09-01",
  endDate: "2026-12-24",
};

const moduleInput: ModuleInput = {
  title: "Модуль материалов",
  description: "",
  releaseCondition: { type: "always" },
};

const lessonInput: LessonInput = {
  title: "Урок с материалами",
  description: "",
  type: "mixed",
  durationMinutes: 30,
  available: true,
  releaseCondition: { type: "always" },
  status: "ready",
  content: "## Контент урока",
  videoKind: "none",
};

const materialInput: MaterialInput = {
  title: "Конспект урока",
  description: "Основной PDF-конспект.",
  type: "pdf",
  fileName: "lesson-notes.pdf",
  sizeBytes: 640_000,
  url: "/materials/algorithms.pdf",
  pageCount: 12,
  downloadAllowed: true,
  availability: "available",
};

function createLessonContext() {
  const course = createCourse(courseInput, userId);
  const module = createModule(course.id, moduleInput, userId);
  const topic = createTopic(module.id, { title: "Тема", description: "" }, userId);
  const lesson = createLesson(topic.id, lessonInput, userId);
  return { course, lesson, module };
}

describe("materialService", () => {
  beforeEach(() => resetCourseManagementData());

  it("provides linked mock materials and matching course aggregates", () => {
    const course = getCourse("course-security");
    const materials = getCourseMaterials("course-security");

    expect(course).toBeTruthy();
    expect(materials).toHaveLength(course?.materialCount ?? 0);
    expect(materials.every((material) => getMaterial(material.id)?.lessonId === material.lessonId)).toBe(true);
    expect(getAllMaterials().length).toBeGreaterThan(100);
  });

  it("creates and updates a typed lesson material", () => {
    const { course, lesson } = createLessonContext();
    const created = createMaterial(lesson.id, materialInput, userId);

    expect(getMaterialsForLesson(lesson.id)).toEqual([expect.objectContaining({ id: created.id, order: 1, type: "pdf" })]);
    expect(getCourse(course.id)?.materialCount).toBe(1);

    const updated = updateMaterial(created.id, { ...materialInput, title: "Обновлённый конспект", availability: "unavailable" }, userId);
    expect(updated).toMatchObject({ title: "Обновлённый конспект", availability: "unavailable" });
    expect(getCourseHistory(course.id).map((event) => event.action)).toEqual(expect.arrayContaining(["Добавлен материал", "Изменён материал"]));
  });

  it("duplicates, reorders and deletes materials with normalized order", () => {
    const { lesson } = createLessonContext();
    const first = createMaterial(lesson.id, materialInput, userId);
    const second = createMaterial(lesson.id, { ...materialInput, title: "Презентация", type: "pptx", fileName: "slides.pptx" }, userId);
    const duplicate = duplicateMaterial(first.id, userId);

    expect(getMaterialsForLesson(lesson.id)).toHaveLength(3);
    expect(moveMaterial(duplicate.id, "up", userId)).toBe(true);
    expect(getMaterialsForLesson(lesson.id).map((material) => material.id)).toEqual([first.id, duplicate.id, second.id]);

    deleteMaterial(first.id, userId);
    expect(getMaterialsForLesson(lesson.id).map((material) => material.order)).toEqual([1, 2]);
  });

  it("copies lesson materials and removes them with the lesson", () => {
    const { course, lesson } = createLessonContext();
    createMaterial(lesson.id, materialInput, userId);
    createMaterial(lesson.id, { ...materialInput, title: "Ссылка", type: "external", fileName: undefined, url: "https://example.com", downloadAllowed: false }, userId);

    const copiedLesson = duplicateLesson(lesson.id, userId);
    expect(getMaterialsForLesson(copiedLesson.id).map((material) => material.title)).toEqual(["Конспект урока", "Ссылка"]);
    expect(getCourse(course.id)?.materialCount).toBe(4);

    deleteLesson(copiedLesson.id, userId);
    expect(getMaterialsForLesson(copiedLesson.id)).toEqual([]);
    expect(getCourse(course.id)?.materialCount).toBe(2);
  });

  it("cascades material deletion when a module is removed", () => {
    const { course, lesson, module } = createLessonContext();
    createMaterial(lesson.id, materialInput, userId);

    deleteModule(module.id, userId);

    expect(getCourseMaterials(course.id)).toEqual([]);
    expect(getCourse(course.id)).toMatchObject({ moduleCount: 0, topicCount: 0, lessonCount: 0, materialCount: 0 });
  });
});
