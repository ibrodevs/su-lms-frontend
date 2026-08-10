import type { Assignment } from "../../types/student";

const baseAssignments: Assignment[] = [
  {
    id: "assignment-dl-01",
    courseId: "digital-literacy",
    title: "Аудит цифровой безопасности",
    description: "Проверьте настройки учебной учётной записи и опишите найденные риски.",
    instructions: "Подготовьте краткий ответ на 300–500 слов и приложите чек-лист.",
    publishedAt: "2026-07-20T09:00:00+06:00",
    dueAt: "2026-08-08T23:59:00+06:00",
    maxScore: 20,
    status: "in-progress",
  },
  {
    id: "assignment-dl-02",
    courseId: "digital-literacy",
    title: "Сравнение форматов файлов",
    description: "Сравните PDF, DOCX и PPTX для учебного проекта.",
    instructions: "Заполните таблицу преимуществ и ограничений каждого формата.",
    publishedAt: "2026-07-24T09:00:00+06:00",
    dueAt: "2026-08-14T23:59:00+06:00",
    maxScore: 15,
    status: "not-started",
  },
  {
    id: "assignment-aw-01",
    courseId: "academic-writing",
    title: "Тезис и аргументация",
    description: "Сформулируйте тезис для исследовательского эссе.",
    instructions: "Добавьте тезис, два аргумента и ссылки на источники.",
    publishedAt: "2026-08-01T09:00:00+06:00",
    dueAt: "2026-08-12T18:00:00+06:00",
    maxScore: 25,
    status: "not-started",
  },
  {
    id: "assignment-en-01",
    courseId: "english-b2",
    title: "Academic presentation outline",
    description: "Create a concise outline for a five-minute presentation.",
    instructions: "Include opening, three key points and a clear conclusion.",
    publishedAt: "2026-07-28T12:00:00+06:00",
    dueAt: "2026-08-09T16:00:00+06:00",
    maxScore: 20,
    status: "submitted",
    submittedAnswer: "Outline uploaded for review.",
  },
  {
    id: "assignment-kh-01",
    courseId: "kyrgyz-history",
    title: "Культурное наследие региона",
    description: "Составьте краткий обзор выбранного объекта наследия.",
    instructions: "Укажите период, источник и современное значение объекта.",
    publishedAt: "2026-07-05T10:00:00+06:00",
    dueAt: "2026-08-18T16:00:00+06:00",
    maxScore: 30,
    status: "not-started",
  },
];

const generatedAssignments: Assignment[] = Array.from({ length: 8 }, (_, index) => {
  const courseId = ["web-development", "database-systems", "software-testing", "project-management"][index % 4]!;
  const dueDay = 11 + index;
  return {
    id: `assignment-generated-${index + 1}`,
    courseId,
    title: `Практическая работа ${index + 1}`,
    description: "Практическое задание из mock-релиза курса.",
    instructions: "Изучите материалы урока, подготовьте ответ и сохраните результат.",
    publishedAt: `2026-08-${String(Math.max(1, dueDay - 5)).padStart(2, "0")}T09:00:00+06:00`,
    dueAt: `2026-08-${String(dueDay).padStart(2, "0")}T18:00:00+06:00`,
    maxScore: 15 + (index % 4) * 5,
    status: index % 4 === 0 ? "in-progress" : "not-started",
  } satisfies Assignment;
});

export const mockAssignments: Assignment[] = [...baseAssignments, ...generatedAssignments];
