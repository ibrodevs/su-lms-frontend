import { apiClient, apiRequest } from "./client";
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
  admission_year?: number;
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
  group?: CourseReferenceDto | null;
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

export interface CourseCopyPayload {
  title: string;
  code: string;
}

export interface CourseWritePayload {
  title: string;
  code: string;
  description: string;
  language: CourseLanguage;
  credits: number;
  semester: number;
  faculty: number;
  department: number;
  program: number;
  group?: number | null;
  teacher?: number;
  start_date: string;
  end_date: string;
  cover?: File;
  syllabus?: File;
}

export interface CourseMutationDto {
  id: number;
}

export function buildCourseWriteFormData(payload: CourseWritePayload): FormData {
  const formData = new FormData();
  const scalarFields: Array<[string, string | number]> = [
    ["title", payload.title],
    ["code", payload.code],
    ["description", payload.description],
    ["language", payload.language],
    ["credits", payload.credits],
    ["semester", payload.semester],
    ["faculty", payload.faculty],
    ["department", payload.department],
    ["program", payload.program],
    ["start_date", payload.start_date],
    ["end_date", payload.end_date],
  ];
  if (payload.teacher !== undefined) scalarFields.push(["teacher", payload.teacher]);
  if (payload.group !== undefined && payload.group !== null) {
    scalarFields.push(["group", payload.group]);
  } else if (payload.group === null) {
    formData.append("group", "");
  }
  scalarFields.forEach(([key, value]) => formData.append(key, String(value)));
  if (payload.cover) formData.append("cover", payload.cover);
  if (payload.syllabus) formData.append("syllabus", payload.syllabus);
  return formData;
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
  group?: number;
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
  if (params.group) searchParams.set("group", String(params.group));
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

  create(payload: CourseWritePayload): Promise<CourseMutationDto> {
    return apiRequest<CourseMutationDto>("/courses/", {
      method: "POST",
      body: buildCourseWriteFormData(payload),
    });
  },

  update(courseId: number, payload: CourseWritePayload): Promise<CourseMutationDto> {
    return apiRequest<CourseMutationDto>(`/courses/${courseId}/`, {
      method: "PATCH",
      body: buildCourseWriteFormData(payload),
    });
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

  copy(courseId: number, payload: CourseCopyPayload): Promise<CourseDetailDto> {
    return apiClient.post<CourseDetailDto>(`/courses/${courseId}/copy/`, payload);
  },
};
