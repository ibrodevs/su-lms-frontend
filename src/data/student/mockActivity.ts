import type { ActivityRecord } from "../../types/student";

export const mockActivity: ActivityRecord[] = [
  { id: "activity-1", courseId: "digital-literacy", lessonId: "dl-security", type: "lesson", title: "Урок открыт", description: "Продолжено изучение цифровой безопасности.", occurredAt: "2026-08-10T15:20:00+06:00" },
  { id: "activity-2", courseId: "digital-literacy", lessonId: "dl-intro", type: "lesson", title: "Урок завершён", description: "Вводный урок отмечен как завершённый.", occurredAt: "2026-08-10T14:40:00+06:00" },
  { id: "activity-3", courseId: "digital-literacy", type: "assignment", title: "Черновик задания сохранён", description: "Ответ по цифровой безопасности сохранён локально.", occurredAt: "2026-08-09T17:15:00+06:00" },
  { id: "activity-4", courseId: "english-b2", lessonId: "en-speaking", type: "lesson", title: "Урок открыт", description: "Начата тема академической презентации.", occurredAt: "2026-08-09T11:30:00+06:00" },
  { id: "activity-5", courseId: "academic-writing", type: "test", title: "Тест доступен", description: "Открыта проверка структуры академического текста.", occurredAt: "2026-08-08T16:10:00+06:00" },
  { id: "activity-6", courseId: "kyrgyz-history", lessonId: "kh-nomads", type: "lesson", title: "Урок завершён", description: "Материал о кочевых обществах изучен.", occurredAt: "2026-08-08T10:00:00+06:00" },
  { id: "activity-7", courseId: "web-development", type: "course", title: "Курс добавлен", description: "Курс веб-разработки появился в учебном плане.", occurredAt: "2026-08-07T13:25:00+06:00" },
  { id: "activity-8", courseId: "database-systems", type: "assignment", title: "Новое задание", description: "Опубликовано практическое задание по моделированию данных.", occurredAt: "2026-08-07T09:45:00+06:00" },
  { id: "activity-9", courseId: "software-testing", type: "test", title: "Новый тест", description: "Доступна проверка знаний по видам тестирования.", occurredAt: "2026-08-06T18:00:00+06:00" },
  { id: "activity-10", courseId: "project-management", type: "course", title: "Материалы обновлены", description: "Добавлены материалы по планированию проекта.", occurredAt: "2026-08-06T12:35:00+06:00" },
];
