export type StaffRole = "teacher" | "content-manager" | "admin";

export type CourseStatus =
  | "draft"
  | "under-review"
  | "published"
  | "archived";

export type CourseLanguage = "ru" | "ky" | "en";

export type ReleaseConditionType =
  | "always"
  | "after-previous"
  | "after-lesson"
  | "date";

export interface ReleaseCondition {
  type: ReleaseConditionType;
  afterLessonId?: string;
  availableFrom?: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  openDate?: string;
  closeDate?: string;
  releaseCondition: ReleaseCondition;
}

export interface CourseTopic {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
}

export type LessonType = "text" | "video" | "material" | "mixed" | "external-link";
export type LessonStatus = "draft" | "ready";
export type LessonVideoKind = "none" | "youtube" | "placeholder";

export type StaffMaterialType =
  | "pdf"
  | "docx"
  | "pptx"
  | "image"
  | "audio"
  | "video"
  | "external"
  | "library";

export type StaffMaterialAvailability = "available" | "unavailable" | "error";

export interface CourseLesson {
  id: string;
  topicId: string;
  title: string;
  description: string;
  type: LessonType;
  durationMinutes: number;
  order: number;
  available: boolean;
  releaseCondition: ReleaseCondition;
  status: LessonStatus;
  content: string;
  videoKind: LessonVideoKind;
  videoUrl?: string;
  videoTitle?: string;
  videoDescription?: string;
}

export interface StaffMaterial {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  type: StaffMaterialType;
  order: number;
  fileName?: string;
  sizeBytes?: number;
  url?: string;
  pageCount?: number;
  durationMinutes?: number;
  downloadAllowed: boolean;
  availability: StaffMaterialAvailability;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleInput {
  title: string;
  description: string;
  openDate?: string;
  closeDate?: string;
  releaseCondition: ReleaseCondition;
}

export interface TopicInput {
  title: string;
  description: string;
}

export interface LessonInput {
  title: string;
  description: string;
  type: LessonType;
  durationMinutes: number;
  available: boolean;
  releaseCondition: ReleaseCondition;
  status: LessonStatus;
  content: string;
  videoKind: LessonVideoKind;
  videoUrl?: string;
  videoTitle?: string;
  videoDescription?: string;
}

export interface MaterialInput {
  title: string;
  description: string;
  type: StaffMaterialType;
  fileName?: string;
  sizeBytes?: number;
  url?: string;
  pageCount?: number;
  durationMinutes?: number;
  downloadAllowed: boolean;
  availability: StaffMaterialAvailability;
}

export interface CourseStructure {
  modules: CourseModule[];
  topics: CourseTopic[];
  lessons: CourseLesson[];
}

export interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: StaffRole;
  departmentId: string;
  position: string;
  avatarUrl?: string;
}

export interface Faculty {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  facultyId: string;
  name: string;
}

export interface Program {
  id: string;
  departmentId: string;
  name: string;
}

export interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface CourseHistoryEvent {
  id: string;
  courseId: string;
  userId: string;
  action: string;
  details?: string;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  language: CourseLanguage;
  credits: number;
  facultyId: string;
  departmentId: string;
  programId: string;
  semesterId: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  coverDataUrl?: string;
  coverName?: string;
  syllabusName?: string;
  status: CourseStatus;
  moduleCount: number;
  topicCount: number;
  lessonCount: number;
  materialCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  publishedAt?: string;
  reviewComment?: string;
}

export interface CourseInput {
  title: string;
  code: string;
  description: string;
  language: CourseLanguage;
  credits: number;
  facultyId: string;
  departmentId: string;
  programId: string;
  semesterId: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  coverDataUrl?: string;
  coverName?: string;
  syllabusName?: string;
}

export type CourseSortField =
  | "title"
  | "code"
  | "createdAt"
  | "updatedAt"
  | "startDate"
  | "status";

export interface CourseFilters {
  query: string;
  status: CourseStatus | "all";
  semesterId: string;
  facultyId: string;
  departmentId: string;
  programId: string;
  teacherId: string;
  language: CourseLanguage | "all";
  sortBy: CourseSortField;
  sortDirection: "asc" | "desc";
}

export interface StaffSession {
  authenticated: boolean;
  userId: string;
  role: StaffRole;
}

export interface StaffStore {
  version: 3;
  courses: Course[];
  history: CourseHistoryEvent[];
  modules: CourseModule[];
  topics: CourseTopic[];
  lessons: CourseLesson[];
  materials: StaffMaterial[];
}

export interface CourseReadiness {
  percentage: number;
  items: Array<{
    label: string;
    complete: boolean;
  }>;
}
