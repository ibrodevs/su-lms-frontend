import type { Course, CourseHistoryEvent, CourseStatus } from "../../types/staff";

const courseSeeds: Array<
  Pick<
    Course,
    | "id"
    | "title"
    | "code"
    | "description"
    | "language"
    | "credits"
    | "facultyId"
    | "departmentId"
    | "programId"
    | "semesterId"
    | "teacherId"
    | "status"
    | "moduleCount"
    | "topicCount"
    | "lessonCount"
    | "materialCount"
  >
> = [
  { id: "course-web", title: "Современная веб-разработка", code: "CS301", description: "React, TypeScript и архитектура современных frontend-приложений.", language: "ru", credits: 5, facultyId: "faculty-digital", departmentId: "department-software", programId: "program-software", semesterId: "semester-fall-2026", teacherId: "teacher-1", status: "draft", moduleCount: 4, topicCount: 9, lessonCount: 16, materialCount: 12 },
  { id: "course-security", title: "Основы кибербезопасности", code: "CS220", description: "Практические основы безопасной разработки и защиты данных.", language: "ru", credits: 4, facultyId: "faculty-digital", departmentId: "department-software", programId: "program-cybersecurity", semesterId: "semester-fall-2026", teacherId: "teacher-1", status: "under-review", moduleCount: 5, topicCount: 10, lessonCount: 18, materialCount: 14 },
  { id: "course-algorithms", title: "Алгоритмы и структуры данных", code: "CS201", description: "Базовые алгоритмы, структуры данных и оценка сложности.", language: "ru", credits: 6, facultyId: "faculty-digital", departmentId: "department-software", programId: "program-software", semesterId: "semester-fall-2026", teacherId: "teacher-1", status: "published", moduleCount: 6, topicCount: 13, lessonCount: 24, materialCount: 18 },
  { id: "course-data", title: "Прикладной анализ данных", code: "DS210", description: "Подготовка данных, визуализация и построение аналитических моделей.", language: "ru", credits: 5, facultyId: "faculty-digital", departmentId: "department-data", programId: "program-data", semesterId: "semester-fall-2026", teacherId: "teacher-2", status: "published", moduleCount: 6, topicCount: 12, lessonCount: 22, materialCount: 16 },
  { id: "course-ai", title: "Введение в искусственный интеллект", code: "AI101", description: "Основные подходы машинного обучения и интеллектуальных систем.", language: "en", credits: 5, facultyId: "faculty-digital", departmentId: "department-data", programId: "program-ai", semesterId: "semester-spring-2027", teacherId: "teacher-2", status: "draft", moduleCount: 2, topicCount: 4, lessonCount: 7, materialCount: 4 },
  { id: "course-management", title: "Стратегический менеджмент", code: "MGT310", description: "Инструменты стратегического анализа и управления организацией.", language: "ru", credits: 4, facultyId: "faculty-economics", departmentId: "department-management", programId: "program-business", semesterId: "semester-fall-2026", teacherId: "teacher-3", status: "under-review", moduleCount: 5, topicCount: 11, lessonCount: 20, materialCount: 13 },
  { id: "course-startup", title: "Предпринимательство и стартапы", code: "MGT205", description: "От проверки идеи до финансовой модели и презентации проекта.", language: "ru", credits: 3, facultyId: "faculty-economics", departmentId: "department-management", programId: "program-business", semesterId: "semester-spring-2027", teacherId: "teacher-3", status: "published", moduleCount: 4, topicCount: 8, lessonCount: 15, materialCount: 10 },
  { id: "course-finance", title: "Корпоративные финансы", code: "FIN301", description: "Финансовый анализ, стоимость капитала и инвестиционные решения.", language: "ru", credits: 5, facultyId: "faculty-economics", departmentId: "department-finance", programId: "program-finance", semesterId: "semester-fall-2026", teacherId: "teacher-4", status: "archived", moduleCount: 5, topicCount: 10, lessonCount: 19, materialCount: 15 },
  { id: "course-economics", title: "Экономика для менеджеров", code: "ECO120", description: "Микро- и макроэкономические основы управленческих решений.", language: "ky", credits: 4, facultyId: "faculty-economics", departmentId: "department-finance", programId: "program-finance", semesterId: "semester-spring-2027", teacherId: "teacher-4", status: "draft", moduleCount: 3, topicCount: 6, lessonCount: 9, materialCount: 6 },
  { id: "course-english", title: "Academic English", code: "ENG201", description: "Академическое письмо, презентации и профессиональная коммуникация.", language: "en", credits: 4, facultyId: "faculty-humanities", departmentId: "department-languages", programId: "program-translation", semesterId: "semester-fall-2026", teacherId: "teacher-5", status: "published", moduleCount: 6, topicCount: 12, lessonCount: 24, materialCount: 20 },
  { id: "course-communication", title: "Межкультурная коммуникация", code: "HUM215", description: "Коммуникация в международной образовательной и деловой среде.", language: "ru", credits: 3, facultyId: "faculty-humanities", departmentId: "department-languages", programId: "program-translation", semesterId: "semester-spring-2027", teacherId: "teacher-5", status: "archived", moduleCount: 4, topicCount: 7, lessonCount: 12, materialCount: 9 },
  { id: "course-psychology", title: "Психология обучения", code: "PSY230", description: "Когнитивные процессы, мотивация и проектирование учебного опыта.", language: "ru", credits: 4, facultyId: "faculty-humanities", departmentId: "department-social", programId: "program-psychology", semesterId: "semester-spring-2027", teacherId: "teacher-6", status: "draft", moduleCount: 3, topicCount: 6, lessonCount: 11, materialCount: 7 },
];

const createdAt = "2026-08-01T09:00:00.000Z";

export const mockCourses: Course[] = courseSeeds.map((course, index) => ({
  ...course,
  startDate: course.semesterId === "semester-fall-2026" ? "2026-09-01" : "2027-01-18",
  endDate: course.semesterId === "semester-fall-2026" ? "2026-12-24" : "2027-05-28",
  coverName: `${course.code.toLowerCase()}-cover.jpg`,
  syllabusName: `${course.code.toLowerCase()}-syllabus.pdf`,
  createdAt,
  updatedAt: new Date(Date.UTC(2026, 7, 2 + index, 10, 0, 0)).toISOString(),
  createdBy: course.teacherId,
  updatedBy: course.teacherId,
  publishedAt: course.status === "published" ? "2026-08-10T08:00:00.000Z" : undefined,
}));

const historyActionByStatus: Record<CourseStatus, string> = {
  draft: "Обновлён черновик курса",
  "under-review": "Курс отправлен на проверку",
  published: "Курс опубликован",
  archived: "Курс архивирован",
};

export const mockCourseHistory: CourseHistoryEvent[] = mockCourses.flatMap(
  (course, courseIndex) => [
    {
      id: `history-${courseIndex + 1}-created`,
      courseId: course.id,
      userId: course.createdBy,
      action: "Создан курс",
      createdAt: course.createdAt,
    },
    {
      id: `history-${courseIndex + 1}-status`,
      courseId: course.id,
      userId: course.updatedBy,
      action: historyActionByStatus[course.status],
      createdAt: course.updatedAt,
    },
  ],
);
