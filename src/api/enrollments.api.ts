import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";

export type EnrollmentStatus = "active" | "completed" | "withdrawn" | "suspended";
export type EnrollmentSource = "manual" | "sis_sync";

export interface EnrollmentStudentDto {
  id: number;
  full_name: string;
  email: string | null;
  student_id: string | null;
}

export interface EnrollmentDto {
  id: number;
  student: EnrollmentStudentDto;
  course: number;
  status: EnrollmentStatus;
  source: EnrollmentSource;
  external_sis_id: string;
  enrolled_at: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentListParams {
  page?: number;
  pageSize?: number;
}

export interface CreateEnrollmentPayload {
  student: number;
  source: "manual";
}

function buildEnrollmentListPath(courseId: number, params: EnrollmentListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("page_size", String(params.pageSize));
  const query = searchParams.toString();
  return `/courses/${courseId}/enrollments/${query ? `?${query}` : ""}`;
}

export const enrollmentsApi = {
  list(courseId: number, params: EnrollmentListParams = {}): Promise<PaginatedResponse<EnrollmentDto>> {
    return apiClient.get<PaginatedResponse<EnrollmentDto>>(buildEnrollmentListPath(courseId, params));
  },

  create(courseId: number, payload: CreateEnrollmentPayload): Promise<EnrollmentDto> {
    return apiClient.post<EnrollmentDto>(`/courses/${courseId}/enrollments/`, payload);
  },
};
