import { afterEach, describe, expect, it, vi } from "vitest";
import { buildStaffCalendarPath, buildStudentCalendarPath, calendarApi } from "./calendar.api";

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
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ count: 0, next: null, previous: null, results: [] }), { status: 200 }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    await calendarApi.student({ pageSize: 100 });

    expect(new URL(String(fetchMock.mock.calls[0]?.[0]), "http://localhost").pathname).toBe("/api/v1/student/calendar/");
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("GET");
  });

  it("maps staff calendar filters and CRUD endpoints", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ count: 0, next: null, previous: null, results: [] }), { status: 200 }),
    ));
    vi.stubGlobal("fetch", fetchMock);

    const path = buildStaffCalendarPath({ course: 8, eventType: "custom", page: 2, pageSize: 20 });
    expect(path).toBe("/calendar/events/?course=8&event_type=custom&page=2&page_size=20");

    const payload = {
      course: 8,
      description: "Release event",
      end_at: null,
      event_type: "custom" as const,
      is_public: true,
      start_at: "2026-09-01T09:00:00Z",
      title: "Office hours",
    };
    await calendarApi.staff({ pageSize: 20 });
    await calendarApi.create(payload);
    await calendarApi.update(12, { title: "Updated office hours" });
    await calendarApi.remove(12);

    expect(fetchMock.mock.calls.map((call) => new URL(String(call[0]), "http://localhost").pathname)).toEqual([
      "/api/v1/calendar/events/",
      "/api/v1/calendar/events/",
      "/api/v1/calendar/events/12/",
      "/api/v1/calendar/events/12/",
    ]);
    expect(fetchMock.mock.calls.map((call) => call[1]?.method)).toEqual(["GET", "POST", "PATCH", "DELETE"]);
  });
});
