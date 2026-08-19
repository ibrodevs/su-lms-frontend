import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";

export type CalendarEventType = "course_start" | "course_end" | "module_release" | "lesson_release" | "custom";

export interface StudentCalendarEventDto {
  id: number;
  course_id: number;
  course_code: string;
  course_title: string;
  title: string;
  description: string;
  event_type: CalendarEventType;
  start_at: string;
  end_at: string | null;
}

export interface StudentCalendarParams {
  dateFrom?: string;
  dateTo?: string;
  course?: number;
  eventType?: CalendarEventType;
  page?: number;
  pageSize?: number;
}

export function buildStudentCalendarPath(params: StudentCalendarParams): string {
  const searchParams = new URLSearchParams();
  if (params.dateFrom) searchParams.set("date_from", params.dateFrom);
  if (params.dateTo) searchParams.set("date_to", params.dateTo);
  if (params.course) searchParams.set("course", String(params.course));
  if (params.eventType) searchParams.set("event_type", params.eventType);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("page_size", String(params.pageSize));
  const query = searchParams.toString();
  return `/student/calendar/${query ? `?${query}` : ""}`;
}

export const calendarApi = {
  student(params: StudentCalendarParams = {}): Promise<PaginatedResponse<StudentCalendarEventDto>> {
    return apiClient.get<PaginatedResponse<StudentCalendarEventDto>>(buildStudentCalendarPath(params));
  },
};
