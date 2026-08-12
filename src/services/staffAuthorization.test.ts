import { beforeEach, describe, expect, it } from "vitest";
import { getCourse, resetCourseManagementData, updateCourse } from "./courseService";
import { canStaffUserAccessCourse } from "./staffAuthorization";
import type { CourseInput } from "../types/staff";

const foreignCourseInput: CourseInput = {
  title: "Прикладной анализ данных",
  code: "DS210",
  description: "Подготовка данных, визуализация и построение аналитических моделей.",
  language: "ru",
  credits: 5,
  facultyId: "faculty-digital",
  departmentId: "department-data",
  programId: "program-data",
  semesterId: "semester-fall-2026",
  teacherId: "teacher-2",
  startDate: "2026-09-01",
  endDate: "2026-12-24",
};

describe("staff course authorization", () => {
  beforeEach(() => resetCourseManagementData());

  it("limits a teacher to assigned courses while allowing management roles", () => {
    const assignedCourse = getCourse("course-security");
    const foreignCourse = getCourse("course-data");
    expect(assignedCourse).not.toBeNull();
    expect(foreignCourse).not.toBeNull();
    if (!assignedCourse || !foreignCourse) return;

    expect(canStaffUserAccessCourse(assignedCourse, "teacher-1")).toBe(true);
    expect(canStaffUserAccessCourse(foreignCourse, "teacher-1")).toBe(false);
    expect(canStaffUserAccessCourse(foreignCourse, "content-1")).toBe(true);
    expect(canStaffUserAccessCourse(foreignCourse, "admin-1")).toBe(true);
  });

  it("rejects direct service updates to another teacher's course", () => {
    expect(() => updateCourse("course-data", foreignCourseInput, "teacher-1")).toThrow(
      "FORBIDDEN_COURSE_ACCESS",
    );
    expect(getCourse("course-data")?.title).toBe("Прикладной анализ данных");
  });
});
