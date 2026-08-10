import type { CalendarEvent } from "../../types/student";

const baseCalendarEvents: CalendarEvent[] = [
  {
    id: "event-dl-module",
    title: "Открытие модуля «Исследование»",
    description: "Станут доступны уроки об информационном поиске и академической честности.",
    courseId: "digital-literacy",
    startsAt: "2026-07-30T09:00:00+06:00",
    type: "module-open",
  },
  {
    id: "event-aw-start",
    title: "Начало курса",
    description: "Открывается вводный модуль курса «Академическое письмо».",
    courseId: "academic-writing",
    lessonId: "aw-argument",
    startsAt: "2026-08-03T10:00:00+06:00",
    type: "course-start",
  },
  {
    id: "event-dl-lesson-close",
    title: "Закрытие доступа к вводному уроку",
    description: "Завершите урок и сохраните материалы до указанной даты.",
    courseId: "digital-literacy",
    lessonId: "dl-intro",
    startsAt: "2026-08-07T18:00:00+06:00",
    type: "lesson-close",
  },
  {
    id: "event-en-lesson",
    title: "Открытие урока по презентациям",
    description: "Новый урок станет доступен в курсе English B2.",
    courseId: "english-b2",
    lessonId: "en-speaking",
    startsAt: "2026-08-12T12:30:00+06:00",
    type: "lesson-open",
  },
  {
    id: "event-dl-end",
    title: "Окончание курса",
    description: "Последний день доступа к материалам курса.",
    courseId: "digital-literacy",
    startsAt: "2026-08-28T23:59:00+06:00",
    type: "course-end",
  },
  {
    id: "event-aw-module",
    title: "Открытие модуля «Аргументация»",
    description: "Будет доступен первый практический урок.",
    courseId: "academic-writing",
    lessonId: "aw-argument",
    startsAt: "2026-09-02T09:00:00+06:00",
    type: "module-open",
  },
];

const generatedCalendarEvents: CalendarEvent[] = Array.from({ length: 28 }, (_, index) => {
  const courseIds = ["web-development", "database-systems", "software-testing", "project-management"];
  const courseId = courseIds[index % courseIds.length]!;
  const day = 10 + index;
  const type: CalendarEvent["type"] = (["lesson-open", "lesson-close", "module-open", "course-start", "course-end"] as const)[index % 5]!;
  return {
    id: `generated-event-${index + 1}`,
    title: `${type === "lesson-open" ? "Новый урок" : type === "lesson-close" ? "Дедлайн урока" : type === "module-open" ? "Открытие модуля" : type === "course-start" ? "Начало курса" : "Завершение курса"} · событие ${index + 1}`,
    description: "Mock-событие учебного календаря.",
    courseId,
    startsAt: `2026-08-${String(((day - 1) % 28) + 1).padStart(2, "0")}T${String(9 + (index % 8)).padStart(2, "0")}:00:00+06:00`,
    type,
  };
});

export const mockCalendarEvents: CalendarEvent[] = [...baseCalendarEvents, ...generatedCalendarEvents];
