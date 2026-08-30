import { apiClient } from "./client";
import type { CourseLanguage, CourseReferenceDto, CourseTeacherDto } from "./courses.api";
import type { LearningMaterialType, LessonType, ReleaseType } from "./learning.api";
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

export type StudentLessonProgressStatus = "not_started" | "in_progress" | "completed";

export interface StudentMaterialDto {
  id: number;
  title: string;
  description: string;
  type: LearningMaterialType;
  external_url: string;
  original_filename: string;
  mime_type: string;
  size: number | null;
  extension: string;
  download_allowed: boolean;
  download_url: string | null;
  video_status: "" | "uploaded" | "processing" | "ready" | "failed";
  duration_seconds: number | null;
  playback_url: string | null;
}

export interface StudentLessonDto {
  id: number;
  title: string;
  description: string;
  lesson_type: LessonType;
  content: string | null;
  estimated_duration_minutes: number | null;
  order: number;
  release_type: ReleaseType;
  release_at: string | null;
  required_lesson: number | null;
  status: StudentLessonProgressStatus;
  is_available: boolean;
  lock_reason: string | null;
  materials: StudentMaterialDto[];
}

export interface StudentTopicDto {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: StudentLessonDto[];
}

export interface StudentModuleDto {
  id: number;
  title: string;
  description: string;
  order: number;
  release_type: Exclude<ReleaseType, "after_lesson">;
  release_at: string | null;
  topics: StudentTopicDto[];
}

export interface StudentCourseDetailDto extends StudentCourseDto {
  overall_progress: number;
  structure: StudentModuleDto[];
}

export interface LessonProgressDto {
  id: number;
  course_id: number;
  lesson_id: number;
  status: StudentLessonProgressStatus;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
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

  course(courseId: number): Promise<StudentCourseDetailDto> {
    return apiClient.get<StudentCourseDetailDto>(`/student/courses/${courseId}/`);
  },

  lesson(lessonId: number): Promise<StudentLessonDto> {
    return apiClient.get<StudentLessonDto>(`/student/lessons/${lessonId}/`);
  },

  startLesson(lessonId: number): Promise<LessonProgressDto> {
    return apiClient.post<LessonProgressDto>(`/student/lessons/${lessonId}/start/`);
  },

  completeLesson(lessonId: number): Promise<LessonProgressDto> {
    return apiClient.post<LessonProgressDto>(`/student/lessons/${lessonId}/complete/`);
  },

  progress(): Promise<StudentProgressDto> {
    return apiClient.get<StudentProgressDto>("/student/progress/");
  },

  courseProgress(courseId: number): Promise<StudentCourseProgressDto> {
    return apiClient.get<StudentCourseProgressDto>(`/student/courses/${courseId}/progress/`);
  },

  downloadMaterial(materialId: number): Promise<Blob> {
    return apiClient.download(`/materials/${materialId}/download/`);
  },
};
