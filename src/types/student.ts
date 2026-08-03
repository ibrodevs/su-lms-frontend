export type CourseStatus = "not-started" | "in-progress" | "completed";
export type LessonProgressStatus = CourseStatus;
export type ResolvedLessonStatus = LessonProgressStatus | "locked";
export type MaterialType =
  | "pdf"
  | "docx"
  | "pptx"
  | "audio"
  | "image"
  | "external"
  | "library"
  | "other";
export type LessonContentType = "video" | "youtube" | "rich-text" | "mixed";
export type CalendarEventType =
  | "course-start"
  | "course-end"
  | "module-open"
  | "lesson-open"
  | "lesson-close";

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  group: string;
  faculty: string;
  program: string;
  semester: string;
  email: string;
}

export interface Instructor {
  name: string;
  title: string;
  email: string;
  bio: string;
}

export interface CourseTopic {
  id: string;
  title: string;
  lessonIds: string[];
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  topics: CourseTopic[];
}

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  faculty: string;
  program: string;
  credits: number;
  semester: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  accent: "ecto" | "macaw" | "navy" | "warning";
  initialStatus: CourseStatus;
  instructor: Instructor;
  syllabus: string[];
  prerequisites: string[];
  materialIds: string[];
  modules: CourseModule[];
}

export interface LessonVideo {
  kind: "youtube" | "placeholder";
  title: string;
  description: string;
  embedUrl?: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  topicId: string;
  title: string;
  description: string;
  durationMinutes: number;
  contentType: LessonContentType;
  content: string;
  materialIds: string[];
  requiresLessonId?: string;
  video?: LessonVideo;
}

export interface Material {
  id: string;
  lessonId?: string;
  courseId: string;
  title: string;
  description: string;
  type: MaterialType;
  size?: string;
  pageCount?: number;
  duration?: string;
  url?: string;
  downloadAllowed: boolean;
  availability:
    | "available"
    | "unavailable"
    | "deleted"
    | "error"
    | "unsupported";
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  courseId: string;
  lessonId?: string;
  startsAt: string;
  type: CalendarEventType;
}

export interface LessonProgressRecord {
  lessonId: string;
  status: LessonProgressStatus;
  updatedAt: string;
  completedAt: string | null;
}

export interface StudentProgressState {
  version: 1;
  lastLessonId: string | null;
  lessons: Record<string, LessonProgressRecord>;
}

export interface CourseProgressSummary {
  completed: number;
  total: number;
  percent: number;
  status: CourseStatus;
  continuationLessonId: string | null;
  lastOpenedLessonId: string | null;
}
