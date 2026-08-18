import { apiClient } from "./client";
import type { CourseCopyPayload, CourseDetailDto } from "./courses.api";

export interface CourseTemplateDto {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCourseTemplatePayload {
  title: string;
  description: string;
  is_active: boolean;
  source_course: number;
}

export const templatesApi = {
  list(): Promise<CourseTemplateDto[]> {
    return apiClient.get<CourseTemplateDto[]>("/course-templates/");
  },

  detail(templateId: number): Promise<CourseTemplateDto> {
    return apiClient.get<CourseTemplateDto>(`/course-templates/${templateId}/`);
  },

  create(payload: CreateCourseTemplatePayload): Promise<CourseTemplateDto> {
    return apiClient.post<CourseTemplateDto>("/course-templates/", payload);
  },

  createCourse(templateId: number, payload: CourseCopyPayload): Promise<CourseDetailDto> {
    return apiClient.post<CourseDetailDto>(`/course-templates/${templateId}/create-course/`, payload);
  },
};
