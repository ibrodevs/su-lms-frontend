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
export type AssignmentStatus =
  | "not-started"
  | "in-progress"
  | "submitted"
  | "reviewed"
  | "overdue";
export type TestStatus =
  | "available"
  | "in-progress"
  | "passed"
  | "failed"
  | "locked";
export type QuestionType = "single" | "multiple" | "boolean" | "text";
export type ScheduleType =
  | "lecture"
  | "practice"
  | "lab"
  | "online"
  | "exam";
export type NotificationType =
  | "lesson"
  | "assignment"
  | "deadline"
  | "test"
  | "result"
  | "reviewed"
  | "announcement"
  | "schedule";

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  group: string;
  faculty: string;
  program: string;
  semester: string;
  email: string;
  phone?: string;
  secondaryEmail?: string;
  dateOfBirth?: string;
  year?: number;
  studentStatus?: "active" | "academic-leave" | "graduated";
  curator?: string;
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

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  instructions: string;
  publishedAt: string;
  dueAt: string;
  maxScore: number;
  status: AssignmentStatus;
  attachmentName?: string;
  draftAnswer?: string;
  submittedAnswer?: string;
  reviewedScore?: number;
}

export interface TestQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctOptionIds?: string[];
  correctText?: string;
}

export interface TestDefinition {
  id: string;
  courseId: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  attemptsAllowed: number;
  status: TestStatus;
  questions: TestQuestion[];
}

export interface TestResult {
  testId: string;
  score: number;
  percent: number;
  passed: boolean;
  completedAt: string;
  answers: Record<string, string | string[]>;
}

export interface ScheduleItem {
  id: string;
  courseId: string;
  title: string;
  instructor: string;
  room: string;
  startsAt: string;
  endsAt: string;
  type: ScheduleType;
  group: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  text: string;
  createdAt: string;
  read: boolean;
  target?: string;
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
