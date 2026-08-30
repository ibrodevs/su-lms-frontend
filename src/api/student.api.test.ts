import { afterEach, describe, expect, it, vi } from "vitest";
import { buildStudentCourseListPath, studentApi } from "./student.api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("student API", () => {
  it("builds canonical student course pagination", () => {
    const url = new URL(buildStudentCourseListPath({ page: 2, pageSize: 100 }), "http://localhost");
    expect(url.pathname).toBe("/student/courses/");
    expect(Object.fromEntries(url.searchParams)).toEqual({ page: "2", page_size: "100" });
  });

  it("uses the canonical student portal endpoints", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);

    await studentApi.dashboard();
    await studentApi.courses({ pageSize: 100 });
    await studentApi.course(4);
    await studentApi.lesson(33);
    await studentApi.startLesson(33);
    await studentApi.completeLesson(33);
    await studentApi.progress();
    await studentApi.courseProgress(4);
    await studentApi.downloadMaterial(9);

    expect(fetchMock.mock.calls.map((call) => new URL(String(call[0]), "http://localhost").pathname)).toEqual([
      "/api/v1/student/dashboard/",
      "/api/v1/student/courses/",
      "/api/v1/student/courses/4/",
      "/api/v1/student/lessons/33/",
      "/api/v1/student/lessons/33/start/",
      "/api/v1/student/lessons/33/complete/",
      "/api/v1/student/progress/",
      "/api/v1/student/courses/4/progress/",
      "/api/v1/materials/9/download/",
    ]);
    expect(fetchMock.mock.calls.map((call) => call[1]?.method)).toEqual([
      "GET",
      "GET",
      "GET",
      "GET",
      "POST",
      "POST",
      "GET",
      "GET",
      "GET",
    ]);
  });
});
