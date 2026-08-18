import { apiClient } from "./client";

export type ReleaseType = "always" | "after_previous" | "after_lesson" | "date";
export type LessonType = "text" | "video" | "material" | "mixed" | "external_link";
export type StructureEntityType = "module" | "topic" | "lesson";

export interface StructureLessonDto {
  id: number;
  title: string;
  order: number;
  lesson_type: LessonType;
  estimated_duration_minutes: number | null;
  release_type: ReleaseType;
  release_at: string | null;
  required_lesson: number | null;
  is_published: boolean;
}

export interface StructureTopicDto {
  id: number;
  title: string;
  order: number;
  lessons: StructureLessonDto[];
}

export interface StructureModuleDto {
  id: number;
  title: string;
  order: number;
  release_type: Exclude<ReleaseType, "after_lesson">;
  release_at: string | null;
  topics: StructureTopicDto[];
}

export interface CourseStructureDto {
  course_id: number;
  modules: StructureModuleDto[];
}

export interface ModuleWritePayload {
  title: string;
  description?: string;
  release_type?: Exclude<ReleaseType, "after_lesson">;
  release_at?: string | null;
}

export interface TopicWritePayload {
  title: string;
  description?: string;
}

export interface LessonWritePayload {
  title: string;
  description?: string;
  lesson_type?: LessonType;
  estimated_duration_minutes?: number | null;
  release_type?: ReleaseType;
  release_at?: string | null;
  required_lesson?: number | null;
  is_published?: boolean;
}

export interface StructureWriteDto {
  id: number;
  title: string;
  order: number;
}

export interface ReorderItem {
  id: number;
  order: number;
}

export const learningApi = {
  structure(courseId: number): Promise<CourseStructureDto> {
    return apiClient.get<CourseStructureDto>(`/courses/${courseId}/structure/`);
  },

  createModule(courseId: number, payload: ModuleWritePayload): Promise<StructureWriteDto> {
    return apiClient.post<StructureWriteDto>(`/courses/${courseId}/modules/`, payload);
  },

  updateModule(moduleId: number, payload: ModuleWritePayload): Promise<StructureWriteDto> {
    return apiClient.patch<StructureWriteDto>(`/modules/${moduleId}/`, payload);
  },

  deleteModule(moduleId: number): Promise<void> {
    return apiClient.delete(`/modules/${moduleId}/`, { json: { confirm: true } });
  },

  createTopic(moduleId: number, payload: TopicWritePayload): Promise<StructureWriteDto> {
    return apiClient.post<StructureWriteDto>(`/modules/${moduleId}/topics/`, payload);
  },

  updateTopic(topicId: number, payload: TopicWritePayload): Promise<StructureWriteDto> {
    return apiClient.patch<StructureWriteDto>(`/topics/${topicId}/`, payload);
  },

  deleteTopic(topicId: number): Promise<void> {
    return apiClient.delete(`/topics/${topicId}/`, { json: { confirm: true } });
  },

  createLesson(topicId: number, payload: LessonWritePayload): Promise<StructureWriteDto> {
    return apiClient.post<StructureWriteDto>(`/topics/${topicId}/lessons/`, payload);
  },

  updateLesson(lessonId: number, payload: LessonWritePayload): Promise<StructureWriteDto> {
    return apiClient.patch<StructureWriteDto>(`/lessons/${lessonId}/`, payload);
  },

  deleteLesson(lessonId: number): Promise<void> {
    return apiClient.delete(`/lessons/${lessonId}/`);
  },

  reorder(courseId: number, type: StructureEntityType, items: ReorderItem[]): Promise<CourseStructureDto> {
    return apiClient.post<CourseStructureDto>(`/courses/${courseId}/structure/reorder/`, { type, items });
  },
};
