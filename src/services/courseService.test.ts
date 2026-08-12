import { beforeEach, describe, expect, it } from "vitest";
import {
  canSubmitForReview,
  changeCourseStatus,
  createCourse,
  filterCourses,
  getCourse,
  getCourseHistory,
  getCourseReviewIssues,
  getCourses,
  getVisibleCourses,
  resetCourseManagementData,
  updateCourse,
} from "./courseService";
import type { CourseFilters, CourseInput } from "../types/staff";

const filters: CourseFilters = {
  query: "",
  status: "all",
  semesterId: "",
  facultyId: "",
  departmentId: "",
  programId: "",
  teacherId: "",
  language: "all",
  sortBy: "updatedAt",
  sortDirection: "desc",
};

const courseInput: CourseInput = {
  title: "Архитектура frontend-приложений",
  code: "CS450",
  description: "Проектирование масштабируемых клиентских приложений.",
  language: "ru",
  credits: 5,
  facultyId: "faculty-digital",
  departmentId: "department-software",
  programId: "program-software",
  semesterId: "semester-fall-2026",
  teacherId: "teacher-1",
  startDate: "2026-09-01",
  endDate: "2026-12-24",
};

describe("courseService", () => {
  beforeEach(() => resetCourseManagementData());

  it("provides the required course distribution and teacher scope", () => {
    const courses = getCourses();

    expect(courses).toHaveLength(12);
    expect(courses.filter((course) => course.status === "draft")).toHaveLength(4);
    expect(courses.filter((course) => course.status === "under-review")).toHaveLength(2);
    expect(courses.filter((course) => course.status === "published")).toHaveLength(4);
    expect(courses.filter((course) => course.status === "archived")).toHaveLength(2);
    expect(getVisibleCourses("teacher", "teacher-1")).toHaveLength(3);
    expect(getVisibleCourses("admin", "admin-1")).toHaveLength(12);
  });

  it("filters by search, status and organization while preserving sort order", () => {
    const result = filterCourses(getCourses(), {
      ...filters,
      query: "CS",
      status: "published",
      facultyId: "faculty-digital",
      sortBy: "code",
      sortDirection: "asc",
    });

    expect(result.map((course) => course.code)).toEqual(["CS201"]);
  });

  it("creates and updates a course through the service layer", () => {
    const created = createCourse(courseInput, "teacher-1");

    expect(created.status).toBe("draft");
    expect(getCourses()).toHaveLength(13);
    expect(getCourse(created.id)?.title).toBe(courseInput.title);

    const updated = updateCourse(
      created.id,
      { ...courseInput, title: "Архитектура современных frontend-приложений" },
      "teacher-1",
    );

    expect(updated.title).toContain("современных");
    expect(getCourseHistory(created.id).map((event) => event.action)).toEqual([
      "Обновлена информация курса",
      "Создан курс",
    ]);
  });

  it("persists lifecycle transitions and review comments", () => {
    changeCourseStatus("course-security", "draft", "content-1", "Добавьте материалы в третий модуль.");
    const returned = getCourse("course-security");

    expect(returned?.status).toBe("draft");
    expect(returned?.reviewComment).toContain("третий модуль");

    changeCourseStatus("course-security", "under-review", "teacher-1");
    changeCourseStatus("course-security", "published", "admin-1");

    expect(getCourse("course-security")?.status).toBe("published");
    expect(getCourse("course-security")?.publishedAt).toBeTruthy();
  });

  it("returns actionable review issues for an incomplete course", () => {
    const created = createCourse(courseInput, "teacher-1");
    const issues = getCourseReviewIssues(created.id);

    expect(issues.map((issue) => issue.id)).toEqual(["cover", "syllabus", "modules"]);
    expect(canSubmitForReview(created)).toBe(false);
    expect(getCourseReviewIssues("course-web")).toEqual([]);
  });

  it("enforces lifecycle order, role permissions and revision comments", () => {
    expect(() =>
      changeCourseStatus("course-security", "published", "teacher-1"),
    ).toThrow("FORBIDDEN_STATUS_TRANSITION");
    expect(() =>
      changeCourseStatus("course-security", "draft", "content-1"),
    ).toThrow("REVIEW_COMMENT_REQUIRED");

    changeCourseStatus(
      "course-security",
      "draft",
      "content-1",
      "Добавьте материалы в третий модуль.",
    );
    expect(getCourse("course-security")?.reviewComment).toContain("третий модуль");

    changeCourseStatus("course-security", "under-review", "teacher-1");
    expect(getCourse("course-security")?.reviewComment).toBeUndefined();
    expect(() =>
      changeCourseStatus("course-security", "archived", "admin-1"),
    ).toThrow("INVALID_STATUS_TRANSITION");

    changeCourseStatus("course-security", "published", "admin-1");
    changeCourseStatus("course-security", "archived", "content-1");
    expect(getCourse("course-security")?.status).toBe("archived");
  });
});
