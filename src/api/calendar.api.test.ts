import { afterEach, describe, expect, it, vi } from "vitest";
import { buildStudentCalendarPath, calendarApi } from "./calendar.api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("calendar API", () => {
  it("maps every student calendar filter to the backend naming", () => {
    const path = buildStudentCalendarPath({
      dateFrom: "2026-08-31",
      dateTo: "2026-10-11",
      course: 4,
      eventType: "lesson_release",
      page: 2,
      pageSize: 100,
    });
    const url = new URL(path, "http://localhost");

    expect(url.pathname).toBe("/student/calendar/");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      date_from: "2026-08-31",
      date_to: "2026-10-11",
      course: "4",
      event_type: "lesson_release",
      page: "2",
      page_size: "100",
    });
  });

  it("uses the canonical student calendar endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ count: 0, next: null, previous: null, results: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await calendarApi.student({ pageSize: 100 });

    expect(new URL(String(fetchMock.mock.calls[0]?.[0]), "http://localhost").pathname).toBe("/api/v1/student/calendar/");
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("GET");
  });
});
