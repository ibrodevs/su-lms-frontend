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

export interface StaffCalendarEventDto {
  id: number;
  course: number;
  title: string;
  description: string;
  event_type: CalendarEventType;
  start_at: string;
  end_at: string | null;
  is_public: boolean;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface StaffCalendarEventPayload {
  course: number;
  title: string;
  description: string;
  event_type: CalendarEventType;
  start_at: string;
  end_at: string | null;
  is_public: boolean;
}

export type StaffCalendarParams = StudentCalendarParams;

export function buildStudentCalendarPath(params: StudentCalendarParams): string {
  return buildCalendarPath("/student/calendar/", params);
}

export function buildStaffCalendarPath(params: StaffCalendarParams): string {
  return buildCalendarPath("/calendar/events/", params);
}

function buildCalendarPath(basePath: string, params: StudentCalendarParams): string {
  const searchParams = new URLSearchParams();
  if (params.dateFrom) searchParams.set("date_from", params.dateFrom);
  if (params.dateTo) searchParams.set("date_to", params.dateTo);
  if (params.course) searchParams.set("course", String(params.course));
  if (params.eventType) searchParams.set("event_type", params.eventType);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("page_size", String(params.pageSize));
  const query = searchParams.toString();
  return `${basePath}${query ? `?${query}` : ""}`;
}

export const calendarApi = {
  student(params: StudentCalendarParams = {}): Promise<PaginatedResponse<StudentCalendarEventDto>> {
    return apiClient.get<PaginatedResponse<StudentCalendarEventDto>>(buildStudentCalendarPath(params));
  },

  staff(params: StaffCalendarParams = {}): Promise<PaginatedResponse<StaffCalendarEventDto>> {
    return apiClient.get<PaginatedResponse<StaffCalendarEventDto>>(buildStaffCalendarPath(params));
  },

  create(payload: StaffCalendarEventPayload): Promise<StaffCalendarEventDto> {
    return apiClient.post<StaffCalendarEventDto>("/calendar/events/", payload);
  },

  update(eventId: number, payload: Partial<StaffCalendarEventPayload>): Promise<StaffCalendarEventDto> {
    return apiClient.patch<StaffCalendarEventDto>(`/calendar/events/${eventId}/`, payload);
  },

  remove(eventId: number): Promise<void> {
    return apiClient.delete(`/calendar/events/${eventId}/`);
  },
};
