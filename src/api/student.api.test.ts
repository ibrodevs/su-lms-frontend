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

  it("uses dashboard, courses and progress endpoints", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);

    await studentApi.dashboard();
    await studentApi.courses({ pageSize: 100 });
    await studentApi.progress();

    expect(fetchMock.mock.calls.map((call) => new URL(String(call[0]), "http://localhost").pathname)).toEqual([
      "/api/v1/student/dashboard/",
      "/api/v1/student/courses/",
      "/api/v1/student/progress/",
    ]);
  });
});
