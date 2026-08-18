import { API_BASE_URL, apiClient } from "./client";

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
  content?: string;
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

export interface LessonDetailDto {
  id: number;
  topic: number;
  title: string;
  description: string;
  lesson_type: LessonType;
  content: string;
  estimated_duration_minutes: number | null;
  order: number;
  release_type: ReleaseType;
  release_at: string | null;
  required_lesson: number | null;
  is_published: boolean;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export type LearningMaterialType =
  | "pdf"
  | "doc"
  | "docx"
  | "ppt"
  | "pptx"
  | "image"
  | "audio"
  | "video"
  | "external_link"
  | "library_link"
  | "other";

export interface LearningMaterialDto {
  id: number;
  lesson: number;
  course: number;
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
  created_at: string;
  updated_at: string;
}

export interface LinkMaterialPayload {
  title: string;
  description?: string;
  type: "external_link" | "library_link";
  external_url: string;
  download_allowed?: boolean;
}

export interface MaterialUpdatePayload {
  title?: string;
  description?: string;
  external_url?: string;
  download_allowed?: boolean;
}

export interface CourseMaterialListParams {
  search?: string;
  type?: LearningMaterialType;
  lesson?: number;
  module?: number;
}

export interface ScormPackageDto {
  id: number;
  course: number;
  lesson: number;
  title: string;
  version: string;
  launch_path: string;
  status: "uploaded" | "ready" | "failed";
  launch_url: string | null;
  created_at: string;
  updated_at: string;
}

export function resolveApiResourceUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = new URL(API_BASE_URL, window.location.origin);
  return new URL(path, baseUrl.origin).toString();
}

export const learningApi = {
  structure(courseId: number): Promise<CourseStructureDto> {
    return apiClient.get<CourseStructureDto>(`/courses/${courseId}/structure/`);
  },

  lesson(lessonId: number): Promise<LessonDetailDto> {
    return apiClient.get<LessonDetailDto>(`/lessons/${lessonId}/`);
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

  lessonMaterials(lessonId: number): Promise<LearningMaterialDto[]> {
    return apiClient.get<LearningMaterialDto[]>(`/lessons/${lessonId}/materials/`);
  },

  courseMaterials(courseId: number, params: CourseMaterialListParams = {}): Promise<LearningMaterialDto[]> {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set("search", params.search);
    if (params.type) searchParams.set("type", params.type);
    if (params.lesson) searchParams.set("lesson", String(params.lesson));
    if (params.module) searchParams.set("module", String(params.module));
    const query = searchParams.toString();
    return apiClient.get<LearningMaterialDto[]>(`/courses/${courseId}/materials/${query ? `?${query}` : ""}`);
  },

  createLinkMaterial(lessonId: number, payload: LinkMaterialPayload): Promise<LearningMaterialDto> {
    return apiClient.post<LearningMaterialDto>(`/lessons/${lessonId}/materials/`, payload);
  },

  uploadMaterial(lessonId: number, payload: { title: string; description?: string; type: LearningMaterialType; file: File; downloadAllowed: boolean }): Promise<LearningMaterialDto> {
    const formData = new FormData();
    formData.set("title", payload.title);
    formData.set("description", payload.description ?? "");
    formData.set("type", payload.type);
    formData.set("file", payload.file);
    formData.set("download_allowed", String(payload.downloadAllowed));
    return apiClient.upload<LearningMaterialDto>(`/lessons/${lessonId}/materials/`, formData);
  },

  updateMaterial(materialId: number, payload: MaterialUpdatePayload): Promise<LearningMaterialDto> {
    return apiClient.patch<LearningMaterialDto>(`/materials/${materialId}/`, payload);
  },

  deleteMaterial(materialId: number): Promise<void> {
    return apiClient.delete(`/materials/${materialId}/`);
  },

  downloadMaterial(materialId: number): Promise<Blob> {
    return apiClient.download(`/materials/${materialId}/download/`);
  },

  scormPackages(lessonId: number): Promise<ScormPackageDto[]> {
    return apiClient.get<ScormPackageDto[]>(`/lessons/${lessonId}/scorm-packages/`);
  },

  uploadScorm(lessonId: number, title: string, file: File): Promise<ScormPackageDto> {
    const formData = new FormData();
    formData.set("title", title);
    formData.set("file", file);
    return apiClient.upload<ScormPackageDto>(`/lessons/${lessonId}/scorm-packages/`, formData);
  },

  reorder(courseId: number, type: StructureEntityType, items: ReorderItem[]): Promise<CourseStructureDto> {
    return apiClient.post<CourseStructureDto>(`/courses/${courseId}/structure/reorder/`, { type, items });
  },
};
