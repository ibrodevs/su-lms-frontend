import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";

export type CourseStatus =
  | "draft"
  | "under_review"
  | "needs_revision"
  | "published"
  | "archived";

export type CourseLanguage = "ru" | "ky" | "en";

export interface CourseReferenceDto {
  id: number;
  name: string;
  code?: string;
}

export interface CourseTeacherDto {
  id: number;
  full_name: string;
}

export interface CourseListDto {
  id: number;
  title: string;
  code: string;
  status: CourseStatus;
  language: CourseLanguage;
  credits: number;
  semester: CourseReferenceDto;
  teacher: CourseTeacherDto | null;
  faculty: CourseReferenceDto;
  department: CourseReferenceDto;
  program: CourseReferenceDto;
  cover: string | null;
  start_date: string;
  end_date: string;
  updated_at: string;
}

export interface CourseDetailDto extends CourseListDto {
  description: string;
  syllabus: string | null;
  review_comment: string;
  published_at: string | null;
  published_by: number | null;
  created_by: number;
  updated_by: number;
  created_at: string;
}

export interface CourseReadinessCheckDto {
  key: string;
  status: "complete" | "warning" | "error";
  message?: string;
}

export interface CourseReadinessDto {
  score: number;
  ready_for_review: boolean;
  checks: CourseReadinessCheckDto[];
}

export interface CourseHistoryEventDto {
  id: number;
  action: string;
  actor: { id: number; full_name: string } | null;
  object: { type: string; id: number; title: string };
  created_at: string;
}

export interface CourseListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CourseStatus;
  language?: CourseLanguage;
  semester?: number;
  faculty?: number;
  department?: number;
  program?: number;
  teacher?: number;
  ordering?: string;
}

export type CourseLifecycleAction =
  | "submit-review"
  | "publish"
  | "archive"
  | "restore";

export function buildCourseListPath(params: CourseListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("page_size", String(params.pageSize));
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.language) searchParams.set("language", params.language);
  if (params.semester) searchParams.set("semester", String(params.semester));
  if (params.faculty) searchParams.set("faculty", String(params.faculty));
  if (params.department) searchParams.set("department", String(params.department));
  if (params.program) searchParams.set("program", String(params.program));
  if (params.teacher) searchParams.set("teacher", String(params.teacher));
  if (params.ordering) searchParams.set("ordering", params.ordering);
  const query = searchParams.toString();
  return `/courses/${query ? `?${query}` : ""}`;
}

export const coursesApi = {
  list(params: CourseListParams = {}): Promise<PaginatedResponse<CourseListDto>> {
    return apiClient.get<PaginatedResponse<CourseListDto>>(buildCourseListPath(params));
  },

  detail(courseId: number): Promise<CourseDetailDto> {
    return apiClient.get<CourseDetailDto>(`/courses/${courseId}/`);
  },

  remove(courseId: number): Promise<void> {
    return apiClient.delete(`/courses/${courseId}/`);
  },

  readiness(courseId: number): Promise<CourseReadinessDto> {
    return apiClient.get<CourseReadinessDto>(`/courses/${courseId}/readiness/`);
  },

  history(courseId: number): Promise<PaginatedResponse<CourseHistoryEventDto>> {
    return apiClient.get<PaginatedResponse<CourseHistoryEventDto>>(`/courses/${courseId}/history/`);
  },

  transition(courseId: number, action: CourseLifecycleAction): Promise<CourseDetailDto> {
    return apiClient.post<CourseDetailDto>(`/courses/${courseId}/${action}/`);
  },

  returnForRevision(courseId: number, comment: string): Promise<CourseDetailDto> {
    return apiClient.post<CourseDetailDto>(`/courses/${courseId}/return-for-revision/`, { comment });
  },
};
