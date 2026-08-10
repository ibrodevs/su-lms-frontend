import type { ScheduleItem } from "../../types/student";

const baseSchedule: ScheduleItem[] = [
  { id: "schedule-1", courseId: "digital-literacy", title: "Цифровая грамотность", instructor: "Алина Бекмурзаева", room: "Аудитория 204", startsAt: "2026-08-05T09:00:00+06:00", endsAt: "2026-08-05T10:30:00+06:00", type: "lecture", group: "ПИ-24-1", status: "scheduled" },
  { id: "schedule-2", courseId: "academic-writing", title: "Академическое письмо", instructor: "Айжан Иманалиева", room: "Онлайн", startsAt: "2026-08-05T11:00:00+06:00", endsAt: "2026-08-05T12:30:00+06:00", type: "online", group: "ПИ-24-1", status: "scheduled" },
  { id: "schedule-3", courseId: "english-b2", title: "English B2 practice", instructor: "Emily Carter", room: "Аудитория 311", startsAt: "2026-08-06T14:00:00+06:00", endsAt: "2026-08-06T15:30:00+06:00", type: "practice", group: "ПИ-24-1", status: "scheduled" },
  { id: "schedule-4", courseId: "kyrgyz-history", title: "История Кыргызстана", instructor: "Эржан Осмонов", room: "Аудитория 108", startsAt: "2026-08-07T10:00:00+06:00", endsAt: "2026-08-07T11:30:00+06:00", type: "lecture", group: "ПИ-24-1", status: "scheduled" },
];

const generatedSchedule: ScheduleItem[] = Array.from({ length: 16 }, (_, index) => {
  const courseId = ["web-development", "database-systems", "software-testing", "project-management"][index % 4]!;
  const day = 10 + (index % 14);
  return {
    id: `schedule-generated-${index + 1}`,
    courseId,
    title: "Практическое занятие",
    instructor: "Преподаватель SU LMS",
    room: index % 3 === 0 ? "Онлайн" : `Аудитория ${200 + (index % 12)}`,
    startsAt: `2026-08-${String(day).padStart(2, "0")}T${String(9 + (index % 7)).padStart(2, "0")}:00:00+06:00`,
    endsAt: `2026-08-${String(day).padStart(2, "0")}T${String(10 + (index % 7)).padStart(2, "0")}:30:00+06:00`,
    type: (["lecture", "practice", "lab", "online", "exam"] as const)[index % 5]!,
    group: "ПИ-24-1",
    status: "scheduled",
  } satisfies ScheduleItem;
});

export const mockSchedule: ScheduleItem[] = [...baseSchedule, ...generatedSchedule];
