import type {
  CourseTemplate,
  CourseTemplateLesson,
  CourseTemplateMaterial,
} from "../../types/staff";

function material(
  id: string,
  title: string,
  type: CourseTemplateMaterial["type"],
): CourseTemplateMaterial {
  return {
    id,
    title,
    description: "Готовый учебный материал шаблона.",
    type,
    fileName: type === "pdf" ? `${id}.pdf` : undefined,
    url: type === "external" ? "https://library.su.edu.kg/" : undefined,
    downloadAllowed: type !== "external",
    availability: "available",
  };
}

function lesson(
  id: string,
  title: string,
  type: CourseTemplateLesson["type"] = "mixed",
  materials: CourseTemplateMaterial[] = [],
): CourseTemplateLesson {
  return {
    id,
    title,
    description: "Урок с готовой структурой для дальнейшего наполнения.",
    type,
    durationMinutes: 35,
    available: true,
    releaseCondition: { type: "after-previous" },
    status: "draft",
    content: `## ${title}\n\nДобавьте учебный контент и практические примеры.`,
    videoKind: "none",
    materials,
  };
}

export const mockCourseTemplates: CourseTemplate[] = [
  {
    id: "template-university-standard",
    name: "Стандартный университетский курс",
    description: "Классическая структура: введение, основная часть и итоговый модуль.",
    creatorId: "content-1",
    language: "ru",
    credits: 4,
    modules: [
      {
        id: "standard-intro",
        title: "Введение в курс",
        description: "Цели, результаты обучения и правила работы.",
        releaseCondition: { type: "always" },
        topics: [
          {
            id: "standard-intro-topic",
            title: "Ориентация",
            description: "Знакомство с программой курса.",
            lessons: [lesson("standard-welcome", "Добро пожаловать", "mixed", [material("standard-guide", "Путеводитель по курсу", "pdf")])],
          },
        ],
      },
      {
        id: "standard-core",
        title: "Основные концепции",
        description: "Ключевая теория и разбор примеров.",
        releaseCondition: { type: "after-previous" },
        topics: [
          {
            id: "standard-core-topic",
            title: "Теория и практика",
            description: "Основной тематический блок.",
            lessons: [
              lesson("standard-theory", "Ключевые понятия", "text"),
              lesson("standard-practice", "Практический разбор", "material", [material("standard-checklist", "Практический чек-лист", "pdf")]),
            ],
          },
        ],
      },
      {
        id: "standard-final",
        title: "Итоговый модуль",
        description: "Повторение и итоговая работа.",
        releaseCondition: { type: "after-previous" },
        topics: [
          {
            id: "standard-final-topic",
            title: "Подведение итогов",
            description: "Закрепление результатов обучения.",
            lessons: [lesson("standard-summary", "Итоги курса", "mixed")],
          },
        ],
      },
    ],
  },
  {
    id: "template-weekly",
    name: "Курс с недельной структурой",
    description: "Четыре последовательные недели с теорией и практикой в каждой.",
    creatorId: "content-1",
    language: "ru",
    credits: 5,
    modules: Array.from({ length: 4 }, (_, moduleIndex) => ({
      id: `weekly-module-${moduleIndex + 1}`,
      title: `Неделя ${moduleIndex + 1}`,
      description: `Учебный план и материалы ${moduleIndex + 1}-й недели.`,
      releaseCondition: moduleIndex === 0 ? { type: "always" as const } : { type: "after-previous" as const },
      topics: [
        {
          id: `weekly-topic-${moduleIndex + 1}`,
          title: `Тема недели ${moduleIndex + 1}`,
          description: "Последовательное изучение темы недели.",
          lessons: [
            lesson(`weekly-theory-${moduleIndex + 1}`, `Теория недели ${moduleIndex + 1}`, "text"),
            lesson(`weekly-practice-${moduleIndex + 1}`, `Практика недели ${moduleIndex + 1}`, "material"),
          ],
        },
      ],
    })),
  },
  {
    id: "template-intensive",
    name: "Короткий интенсив",
    description: "Компактный курс для быстрого погружения и практического результата.",
    creatorId: "admin-1",
    language: "ru",
    credits: 2,
    modules: [
      {
        id: "intensive-foundation",
        title: "Быстрый старт",
        description: "Минимум теории для начала работы.",
        releaseCondition: { type: "always" },
        topics: [
          {
            id: "intensive-foundation-topic",
            title: "Основы",
            description: "Ключевые понятия интенсива.",
            lessons: [lesson("intensive-basics", "Основы за 30 минут", "video")],
          },
        ],
      },
      {
        id: "intensive-project",
        title: "Практический результат",
        description: "Пошаговая работа над мини-проектом.",
        releaseCondition: { type: "after-previous" },
        topics: [
          {
            id: "intensive-project-topic",
            title: "Мини-проект",
            description: "Применение знаний на практике.",
            lessons: [
              lesson("intensive-workshop", "Практикум", "mixed", [material("intensive-brief", "Бриф мини-проекта", "pdf")]),
              lesson("intensive-summary", "Разбор результата", "mixed"),
            ],
          },
        ],
      },
    ],
  },
];
