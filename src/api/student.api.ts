import { apiClient } from "./client";
import type { CourseLanguage, CourseReferenceDto, CourseTeacherDto } from "./courses.api";
import type { PaginatedResponse } from "./types";

export interface StudentCourseDto {
  id: number;
  title: string;
  code: string;
  description: string;
  language: CourseLanguage;
  credits: number;
  semester: CourseReferenceDto;
  teacher: CourseTeacherDto | null;
  faculty: CourseReferenceDto;
  department: CourseReferenceDto;
  program: CourseReferenceDto;
  status: "published";
  cover: string | null;
  syllabus: string | null;
  start_date: string;
  end_date: string;
}

export interface StudentCourseProgressDto {
  course_id: number;
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number;
}

export interface StudentProgressDto {
  total_courses: number;
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number;
  courses: StudentCourseProgressDto[];
}

export interface DashboardCourseDto extends StudentCourseProgressDto {
  title: string;
  code: string;
}

export interface ContinueLearningDto {
  course_id?: number;
  course_title?: string;
  lesson_id?: number;
  lesson_title?: string;
  status?: "not_started" | "in_progress" | "completed";
}

export type DashboardEventType = "course_start" | "course_end" | "module_release" | "lesson_release" | "custom";

export interface DashboardCalendarEventDto {
  id: number;
  course_id: number;
  title: string;
  event_type: DashboardEventType;
  start_at: string;
  end_at: string | null;
}

export interface StudentDashboardDto {
  active_courses: number;
  completed_lessons: number;
  overall_progress: number;
  continue_learning: ContinueLearningDto;
  courses: DashboardCourseDto[];
  upcoming_events: DashboardCalendarEventDto[];
}

export interface StudentCourseListParams {
  page?: number;
  pageSize?: number;
}

export function buildStudentCourseListPath(params: StudentCourseListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("page_size", String(params.pageSize));
  const query = searchParams.toString();
  return `/student/courses/${query ? `?${query}` : ""}`;
}

export const studentApi = {
  dashboard(): Promise<StudentDashboardDto> {
    return apiClient.get<StudentDashboardDto>("/student/dashboard/");
  },

  courses(params: StudentCourseListParams = {}): Promise<PaginatedResponse<StudentCourseDto>> {
    return apiClient.get<PaginatedResponse<StudentCourseDto>>(buildStudentCourseListPath(params));
  },

  progress(): Promise<StudentProgressDto> {
    return apiClient.get<StudentProgressDto>("/student/progress/");
  },
};
