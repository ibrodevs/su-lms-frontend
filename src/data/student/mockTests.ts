import type { TestDefinition } from "../../types/student";

const baseTests: TestDefinition[] = [
  {
    id: "test-dl-01",
    courseId: "digital-literacy",
    title: "Основы цифровой грамотности",
    description: "Проверьте понимание первых модулей курса.",
    durationMinutes: 12,
    passingScore: 70,
    attemptsAllowed: 3,
    status: "available",
    questions: [
      { id: "dl-q1", type: "single", prompt: "Какой формат лучше подходит для финальной передачи документа?", options: ["PDF", "DOCX", "TXT"], correctOptionIds: ["0"] },
      { id: "dl-q2", type: "multiple", prompt: "Выберите безопасные практики.", options: ["Уникальный пароль", "Передача кода в чате", "Проверка адреса сайта"], correctOptionIds: ["0", "2"] },
      { id: "dl-q3", type: "boolean", prompt: "Нужно завершать сессию на общем компьютере.", options: ["Да", "Нет"], correctOptionIds: ["0"] },
    ],
  },
  {
    id: "test-aw-01",
    courseId: "academic-writing",
    title: "Структура академического текста",
    description: "Короткий тест по тезису, аргументам и источникам.",
    durationMinutes: 10,
    passingScore: 70,
    attemptsAllowed: 2,
    status: "available",
    questions: [
      { id: "aw-q1", type: "single", prompt: "Что определяет направление всего текста?", options: ["Тезис", "Список литературы", "Заголовок"], correctOptionIds: ["0"] },
      { id: "aw-q2", type: "text", prompt: "Одним словом назовите проверяемое утверждение текста.", correctText: "тезис" },
    ],
  },
  {
    id: "test-en-01",
    courseId: "english-b2",
    title: "Academic speaking",
    description: "Practice signposting and presentation structure.",
    durationMinutes: 15,
    passingScore: 60,
    attemptsAllowed: 3,
    status: "locked",
    questions: [
      { id: "en-q1", type: "single", prompt: "Which phrase introduces a new section?", options: ["Let us move to", "Goodbye", "Never mind"], correctOptionIds: ["0"] },
    ],
  },
];

const generatedTests: TestDefinition[] = Array.from({ length: 5 }, (_, index) => {
  const courseId = ["web-development", "database-systems", "software-testing", "project-management"][index % 4]!;
  return {
    id: `test-generated-${index + 1}`,
    courseId,
    title: `Итоговый тест модуля ${index + 1}`,
    description: "Короткая проверка понимания учебных материалов курса.",
    durationMinutes: 10 + index,
    passingScore: 70,
    attemptsAllowed: 2,
    status: index === 4 ? "locked" : "available",
    questions: [
      { id: `generated-question-${index + 1}`, type: "single", prompt: "Выберите правильный вариант ответа.", options: ["Правильный ответ", "Отвлекающий вариант", "Другой вариант"], correctOptionIds: ["0"] },
    ],
  } satisfies TestDefinition;
});

export const mockTests: TestDefinition[] = [...baseTests, ...generatedTests];
