import { afterEach, describe, expect, it, vi } from "vitest";
import { templatesApi } from "./templates.api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("course templates API", () => {
  it("uses canonical list, detail, create and materialize endpoints", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);

    await templatesApi.list();
    await templatesApi.detail(4);
    await templatesApi.create({
      title: "Starter",
      description: "Reusable course structure",
      is_active: true,
      source_course: 7,
    });
    await templatesApi.createCourse(4, { title: "New Course", code: "NEW-101" });

    expect(fetchMock.mock.calls.map((call) => ({
      method: call[1]?.method,
      path: new URL(String(call[0]), "http://localhost").pathname,
    }))).toEqual([
      { method: "GET", path: "/api/v1/course-templates/" },
      { method: "GET", path: "/api/v1/course-templates/4/" },
      { method: "POST", path: "/api/v1/course-templates/" },
      { method: "POST", path: "/api/v1/course-templates/4/create-course/" },
    ]);
    expect(fetchMock.mock.calls[2]?.[1]?.body).toBe(JSON.stringify({
      title: "Starter",
      description: "Reusable course structure",
      is_active: true,
      source_course: 7,
    }));
    expect(fetchMock.mock.calls[3]?.[1]?.body).toBe(JSON.stringify({ title: "New Course", code: "NEW-101" }));
  });
});
