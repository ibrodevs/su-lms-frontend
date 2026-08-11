export type StaffRole = "teacher" | "content-manager" | "admin";

export type CourseStatus =
  | "draft"
  | "under-review"
  | "published"
  | "archived";

export type CourseLanguage = "ru" | "ky" | "en";

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
  version: 1;
  courses: Course[];
  history: CourseHistoryEvent[];
}

export interface CourseReadiness {
  percentage: number;
  items: Array<{
    label: string;
    complete: boolean;
  }>;
}
