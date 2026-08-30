import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCourseListPath, coursesApi } from "./courses.api";
import type { CourseWritePayload } from "./courses.api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("courses API", () => {
  it("builds canonical server-side filters and pagination", () => {
    const path = buildCourseListPath({
      page: 3,
      pageSize: 20,
      search: "programming",
      status: "under_review",
      language: "en",
      semester: 2,
      faculty: 1,
      department: 3,
      program: 4,
      teacher: 5,
      ordering: "-updated_at",
    });
    const url = new URL(path, "http://localhost");

    expect(url.pathname).toBe("/courses/");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: "3",
      page_size: "20",
      search: "programming",
      status: "under_review",
      language: "en",
      semester: "2",
      faculty: "1",
      department: "3",
      program: "4",
      teacher: "5",
      ordering: "-updated_at",
    });
  });

  it("uses canonical detail, readiness, history and lifecycle paths", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);

    await coursesApi.detail(7);
    await coursesApi.readiness(7);
    await coursesApi.history(7);
    await coursesApi.transition(7, "submit-review");
    await coursesApi.returnForRevision(7, "Add syllabus");

    const calls = fetchMock.mock.calls.map((call) => ({
      method: call[1]?.method,
      pathname: new URL(String(call[0]), "http://localhost").pathname,
      body: call[1]?.body,
    }));
    expect(calls).toEqual([
      { method: "GET", pathname: "/api/v1/courses/7/", body: undefined },
      { method: "GET", pathname: "/api/v1/courses/7/readiness/", body: undefined },
      { method: "GET", pathname: "/api/v1/courses/7/history/", body: undefined },
      { method: "POST", pathname: "/api/v1/courses/7/submit-review/", body: undefined },
      { method: "POST", pathname: "/api/v1/courses/7/return-for-revision/", body: JSON.stringify({ comment: "Add syllabus" }) },
    ]);
  });

  it("deletes only through the canonical course detail endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await coursesApi.remove(12);

    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/\/api\/v1\/courses\/12\/$/);
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("DELETE");
  });

  it("copies a course through the canonical endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 13 }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await coursesApi.copy(12, { title: "Course Copy", code: "CS101-COPY" });

    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/\/api\/v1\/courses\/12\/copy\/$/);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ title: "Course Copy", code: "CS101-COPY" }),
    });
  });

  it("creates and updates courses with the canonical multipart payload", async () => {
    const fetchMock = vi.fn().mockImplementation(
      () => Promise.resolve(new Response(JSON.stringify({ id: 21 }), { status: 200 })),
    );
    vi.stubGlobal("fetch", fetchMock);
    const payload: CourseWritePayload = {
      title: "API Integration",
      code: "CS-API",
      description: "Real backend course",
      language: "en",
      credits: 5,
      semester: 4,
      faculty: 1,
      department: 2,
      program: 3,
      teacher: 7,
      start_date: "2026-09-01",
      end_date: "2026-12-24",
    };

    await coursesApi.create(payload);
    await coursesApi.update(21, payload);

    expect(fetchMock.mock.calls.map((call) => call[1]?.method)).toEqual(["POST", "PATCH"]);
    expect(String(fetchMock.mock.calls[1]?.[0])).toMatch(/\/api\/v1\/courses\/21\/$/);
    const body = fetchMock.mock.calls[0]?.[1]?.body;
    expect(body).toBeInstanceOf(FormData);
    expect(Object.fromEntries((body as FormData).entries())).toMatchObject({
      title: "API Integration",
      code: "CS-API",
      semester: "4",
      faculty: "1",
      department: "2",
      program: "3",
      teacher: "7",
    });
  });
});
