import { afterEach, describe, expect, it, vi } from "vitest";
import { enrollmentsApi } from "./enrollments.api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("enrollments API", () => {
  it("lists paginated course enrollments", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ count: 0, next: null, previous: null, results: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await enrollmentsApi.list(7, { page: 2, pageSize: 50 });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]), "http://localhost");
    expect(url.pathname).toBe("/api/v1/courses/7/enrollments/");
    expect(Object.fromEntries(url.searchParams)).toEqual({ page: "2", page_size: "50" });
  });

  it("creates only a manual enrollment through the course endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 3 }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await enrollmentsApi.create(7, { student: 12, source: "manual" });

    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/\/api\/v1\/courses\/7\/enrollments\/$/);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "POST", body: JSON.stringify({ student: 12, source: "manual" }) });
  });
});
