import type { StudentCalendarParams } from "./calendar.api";

export const calendarKeys = {
  all: ["calendar"] as const,
  studentLists: () => [...calendarKeys.all, "student"] as const,
  student: (params: StudentCalendarParams) => [...calendarKeys.studentLists(), params] as const,
};
