import type { StaffCalendarParams, StudentCalendarParams } from "./calendar.api";

export const calendarKeys = {
  all: ["calendar"] as const,
  studentLists: () => [...calendarKeys.all, "student"] as const,
  student: (params: StudentCalendarParams) => [...calendarKeys.studentLists(), params] as const,
  staffLists: () => [...calendarKeys.all, "staff"] as const,
  staff: (params: StaffCalendarParams) => [...calendarKeys.staffLists(), params] as const,
};
