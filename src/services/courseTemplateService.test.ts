import { beforeEach, describe, expect, it } from "vitest";
import type { CourseInput } from "../types/staff";
import { getCourse, getCourseHistory, resetCourseManagementData } from "./courseService";
import {
  copyCourse,
  createCourseFromTemplate,
  filterCourseTemplates,
  getCourseTemplates,
  getCourseTemplateStats,
} from "./courseTemplateService";
import { readStaffStore } from "./staffStore";

const courseInput: CourseInput = {
  title: "Проектирование цифрового продукта",
  code: "UX410",
  description: "Практический курс по проектированию цифровых продуктов.",
  language: "ru",
  credits: 4,
  facultyId: "faculty-digital",
  departmentId: "department-software",
  programId: "program-software",
  semesterId: "semester-fall-2026",
  teacherId: "teacher-1",
  startDate: "2026-09-01",
  endDate: "2026-12-24",
};

describe("courseTemplateService", () => {
  beforeEach(() => resetCourseManagementData());

  it("provides three searchable templates with ready structure", () => {
    const templates = getCourseTemplates();

    expect(templates).toHaveLength(3);
    expect(filterCourseTemplates(templates, "недельной").map((template) => template.id)).toEqual([
      "template-weekly",
    ]);
    const firstTemplate = templates[0];
    expect(firstTemplate).toBeDefined();
    if (!firstTemplate) return;
    expect(getCourseTemplateStats(firstTemplate)).toEqual({
      moduleCount: 3,
      topicCount: 3,
      lessonCount: 4,
      materialCount: 2,
    });
  });

  it("copies course metadata, structure and materials into a clean draft", () => {
    const sourceStore = readStaffStore();
    const sourceCourse = getCourse("course-security");
    const copied = copyCourse("course-security", "content-1");
    const copiedStore = readStaffStore();

    expect(sourceCourse).not.toBeNull();
    expect(copied.code).toBe("CS220-COPY");
    expect(copied.status).toBe("draft");
    expect(copied.publishedAt).toBeUndefined();
    expect(copied.reviewComment).toBeUndefined();
    expect(copied.moduleCount).toBe(sourceCourse?.moduleCount);
    expect(copied.lessonCount).toBe(sourceCourse?.lessonCount);
    expect(copied.materialCount).toBe(sourceCourse?.materialCount);
    expect(getCourseHistory(copied.id).map((event) => event.action)).toEqual(["Курс скопирован"]);

    const sourceModuleIds = new Set(sourceStore.modules.filter((module) => module.courseId === "course-security").map((module) => module.id));
    const copiedModuleIds = copiedStore.modules.filter((module) => module.courseId === copied.id).map((module) => module.id);
    expect(copiedModuleIds.every((id) => !sourceModuleIds.has(id))).toBe(true);
    expect(getCourse("course-security")?.status).toBe("under-review");
  });

  it("creates unique copy codes and rejects teacher copy attempts", () => {
    copyCourse("course-security", "admin-1");
    expect(copyCourse("course-security", "content-1").code).toBe("CS220-COPY-2");
    expect(() => copyCourse("course-security", "teacher-1")).toThrow("FORBIDDEN_COURSE_COPY");
  });

  it("creates a persisted draft with the selected template structure", () => {
    const template = getCourseTemplates().find((item) => item.id === "template-intensive");
    expect(template).toBeDefined();
    if (!template) return;

    const stats = getCourseTemplateStats(template);
    const created = createCourseFromTemplate(template.id, courseInput, "content-1");
    const store = readStaffStore();

    expect(created.status).toBe("draft");
    expect(created.moduleCount).toBe(stats.moduleCount);
    expect(created.topicCount).toBe(stats.topicCount);
    expect(created.lessonCount).toBe(stats.lessonCount);
    expect(created.materialCount).toBe(stats.materialCount);
    expect(store.courses.some((course) => course.id === created.id)).toBe(true);
    expect(getCourseHistory(created.id).map((event) => event.action)).toEqual([
      "Курс создан из шаблона",
      "Создан курс",
    ]);
  });
});
