import { afterEach, describe, expect, it, vi } from "vitest";
import { learningApi } from "./learning.api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("learning structure API", () => {
  it("uses canonical nested structure CRUD endpoints", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);

    await learningApi.structure(4);
    await learningApi.createModule(4, { title: "Module" });
    await learningApi.createTopic(8, { title: "Topic" });
    await learningApi.createLesson(9, { title: "Lesson", lesson_type: "text" });
    await learningApi.updateLesson(10, { title: "Updated" });

    expect(fetchMock.mock.calls.map((call) => ({
      method: call[1]?.method,
      path: new URL(String(call[0]), "http://localhost").pathname,
    }))).toEqual([
      { method: "GET", path: "/api/v1/courses/4/structure/" },
      { method: "POST", path: "/api/v1/courses/4/modules/" },
      { method: "POST", path: "/api/v1/modules/8/topics/" },
      { method: "POST", path: "/api/v1/topics/9/lessons/" },
      { method: "PATCH", path: "/api/v1/lessons/10/" },
    ]);
  });

  it("sends explicit cascade confirmation and atomic reorder payloads", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal("fetch", fetchMock);

    await learningApi.deleteModule(3);
    await learningApi.deleteTopic(5);
    await learningApi.reorder(7, "lesson", [{ id: 11, order: 1 }, { id: 10, order: 2 }]);

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "DELETE", body: JSON.stringify({ confirm: true }) });
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: "DELETE", body: JSON.stringify({ confirm: true }) });
    expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ type: "lesson", items: [{ id: 11, order: 1 }, { id: 10, order: 2 }] }),
    });
  });
});
