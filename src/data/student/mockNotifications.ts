import type { NotificationItem } from "../../types/student";

const baseNotifications: NotificationItem[] = [
  { id: "notification-1", type: "deadline", title: "Приближается дедлайн", text: "Задание «Аудит цифровой безопасности» нужно сдать до 8 августа.", createdAt: "2026-08-05T08:30:00+06:00", read: false, target: "/student/assignments/assignment-dl-01" },
  { id: "notification-2", type: "lesson", title: "Новый урок", text: "В курсе «Цифровая грамотность» доступен новый материал.", createdAt: "2026-08-04T14:20:00+06:00", read: false, target: "/student/courses/digital-literacy" },
  { id: "notification-3", type: "test", title: "Доступен новый тест", text: "Тест «Основы цифровой грамотности» готов к прохождению.", createdAt: "2026-08-03T12:00:00+06:00", read: true, target: "/student/tests/test-dl-01" },
  { id: "notification-4", type: "schedule", title: "Изменение расписания", text: "Занятие по английскому перенесено на 6 августа.", createdAt: "2026-08-02T18:00:00+06:00", read: true, target: "/student/schedule" },
  { id: "notification-5", type: "announcement", title: "Новое объявление", text: "Опубликована памятка по подготовке к Release 1.", createdAt: "2026-08-01T09:00:00+06:00", read: false, target: "/student" },
];

const generatedNotifications: NotificationItem[] = Array.from({ length: 22 }, (_, index) => ({
  id: `notification-generated-${index + 1}`,
  type: (["lesson", "assignment", "deadline", "test", "result", "reviewed", "announcement", "schedule"] as const)[index % 8]!,
  title: `Учебное уведомление ${index + 1}`,
  text: "Это демонстрационное уведомление из mock-данных Release 1.",
  createdAt: `2026-08-${String(Math.max(1, 5 - (index % 4))).padStart(2, "0")}T${String(8 + (index % 10)).padStart(2, "0")}:00:00+06:00`,
  read: index % 3 === 0,
  target: index % 2 === 0 ? "/student" : "/student/notifications",
} satisfies NotificationItem));

export const mockNotifications: NotificationItem[] = [...baseNotifications, ...generatedNotifications];
