import type { Course } from "../../types/student";

const digitalInstructor = {
  name: "Алина Бекмурзаева",
  title: "Старший преподаватель цифровых дисциплин",
  email: "a.bekmurzaeva@su.edu.kg",
  bio: "Разрабатывает практические программы по цифровой грамотности и образовательным технологиям.",
};

const baseCourses: Course[] = [
  {
    id: "digital-literacy",
    title: "Цифровая грамотность",
    code: "DIG-101",
    description:
      "Практический курс о безопасной и эффективной работе с цифровыми сервисами, файлами и источниками.",
    faculty: "Факультет цифровых технологий",
    program: "Общеуниверситетская дисциплина",
    credits: 3,
    semester: "Весна 2026",
    startDate: "2026-02-02",
    endDate: "2026-05-29",
    coverImage: "/images/subjects/informatics.svg",
    accent: "ecto",
    initialStatus: "in-progress",
    instructor: digitalInstructor,
    syllabus: [
      "Цифровая безопасность",
      "Работа с файлами и совместное редактирование",
      "Информационный поиск и академическая честность",
      "Цифровая коммуникация",
    ],
    prerequisites: ["Базовые навыки работы с компьютером", "Университетская учётная запись"],
    materialIds: ["dl-campus-guide", "dl-library-link"],
    modules: [
      {
        id: "dl-foundations",
        title: "Модуль 1. Цифровая основа",
        description: "Сервисы университета и безопасность учётной записи.",
        topics: [
          {
            id: "dl-digital-world",
            title: "Цифровая среда",
            lessonIds: ["dl-intro", "dl-security"],
          },
        ],
      },
      {
        id: "dl-productivity",
        title: "Модуль 2. Продуктивность",
        description: "Файлы, форматы и совместная работа.",
        topics: [
          {
            id: "dl-file-work",
            title: "Работа с контентом",
            lessonIds: ["dl-files", "dl-collaboration"],
          },
        ],
      },
      {
        id: "dl-research-module",
        title: "Модуль 3. Исследование и коммуникация",
        description: "Источники, честность и представление результата.",
        topics: [
          {
            id: "dl-search",
            title: "Информационный поиск",
            lessonIds: ["dl-research", "dl-citations"],
          },
          {
            id: "dl-presenting",
            title: "Представление результата",
            lessonIds: ["dl-presentation", "dl-final"],
          },
        ],
      },
    ],
  },
  {
    id: "academic-writing",
    title: "Академическое письмо",
    code: "AW-202",
    description: "Структура академического текста, аргументация и работа с источниками.",
    faculty: "Гуманитарный факультет",
    program: "Программная инженерия",
    credits: 4,
    semester: "Весна 2026",
    startDate: "2026-02-02",
    endDate: "2026-06-05",
    coverImage: "/images/subjects/english.svg",
    accent: "macaw",
    initialStatus: "not-started",
    instructor: {
      name: "Айжан Иманалиева",
      title: "Преподаватель академического письма",
      email: "a.imanalieva@su.edu.kg",
      bio: "Исследует академическую коммуникацию и методику университетского письма.",
    },
    syllabus: ["Тезис", "Абзац", "Аргументация", "Редактирование"],
    prerequisites: ["Английский язык B1"],
    materialIds: [],
    modules: [
      {
        id: "aw-basics",
        title: "Основы академического текста",
        description: "Тезис и логическая структура.",
        topics: [{ id: "aw-structure", title: "Структура", lessonIds: ["aw-argument"] }],
      },
    ],
  },
  {
    id: "kyrgyz-history",
    title: "История Кыргызстана",
    code: "HIS-110",
    description: "Ключевые периоды истории Кыргызстана и культурное наследие региона.",
    faculty: "Гуманитарный факультет",
    program: "Общеуниверситетская дисциплина",
    credits: 3,
    semester: "Осень 2025",
    startDate: "2025-09-01",
    endDate: "2025-12-19",
    coverImage: "/images/subjects/history.svg",
    accent: "warning",
    initialStatus: "completed",
    instructor: {
      name: "Эржан Осмонов",
      title: "Кандидат исторических наук",
      email: "e.osmonov@su.edu.kg",
      bio: "Специализируется на истории и культурном наследии Центральной Азии.",
    },
    syllabus: ["Древняя история", "Кочевые общества", "Новейшая история"],
    prerequisites: [],
    materialIds: [],
    modules: [
      {
        id: "kh-origins",
        title: "Истоки и культура",
        description: "Общество и традиции региона.",
        topics: [{ id: "kh-culture", title: "Культура", lessonIds: ["kh-nomads"] }],
      },
    ],
  },
  {
    id: "english-b2",
    title: "Английский язык B2",
    code: "ENG-204",
    description: "Академическая коммуникация, презентации и профессиональная лексика.",
    faculty: "Языковой центр",
    program: "Программная инженерия",
    credits: 5,
    semester: "Весна 2026",
    startDate: "2026-02-02",
    endDate: "2026-06-05",
    coverImage: "/images/subjects/english.svg",
    accent: "navy",
    initialStatus: "in-progress",
    instructor: {
      name: "Emily Carter",
      title: "Senior English Instructor",
      email: "e.carter@su.edu.kg",
      bio: "Teaches academic English and professional communication.",
    },
    syllabus: ["Academic speaking", "Professional vocabulary", "Listening strategies"],
    prerequisites: ["Английский язык B1"],
    materialIds: [],
    modules: [
      {
        id: "en-communication",
        title: "Academic communication",
        description: "Clear and confident academic speaking.",
        topics: [
          {
            id: "en-speaking-topic",
            title: "Speaking",
            lessonIds: ["en-speaking"],
          },
        ],
      },
    ],
  },
];

const generatedCourseMeta = [
  ["web-development", "Веб-разработка", "WEB-301", "Факультет цифровых технологий"],
  ["database-systems", "Базы данных", "DB-210", "Факультет цифровых технологий"],
  ["software-testing", "Тестирование ПО", "QA-220", "Факультет цифровых технологий"],
  ["project-management", "Управление проектами", "PM-115", "Школа менеджмента"],
] as const;

const generatedCourses: Course[] = generatedCourseMeta.map(([id, title, code, faculty], courseIndex) => ({
  id,
  title,
  code,
  description: `Практический курс ${title.toLowerCase()} с модульной программой и mock-сценариями обучения.`,
  faculty,
  program: "Программная инженерия",
  credits: 4,
  semester: "Осень 2026",
  startDate: "2026-09-01",
  endDate: "2026-12-18",
  coverImage: "/images/subjects/informatics.svg",
  accent: (courseIndex % 2 === 0 ? "ecto" : "macaw") as Course["accent"],
  initialStatus: courseIndex === 0 ? "in-progress" : "not-started",
  instructor: {
    name: ["Нурбек Токтогулов", "Мээрим Сапарова", "Руслан Ким", "Данияр Абдрахманов"][courseIndex]!,
    title: "Преподаватель SU LMS",
    email: `teacher${courseIndex + 1}@su.edu.kg`,
    bio: "Практикующий специалист и наставник студенческих проектов.",
  },
  syllabus: ["Основы", "Практика", "Итоговый проект"],
  prerequisites: [],
  materialIds: [],
  modules: Array.from({ length: 2 }, (_, moduleIndex) => ({
    id: `${id}-module-${moduleIndex + 1}`,
    title: `Модуль ${moduleIndex + 1}. ${moduleIndex === 0 ? "Основы" : "Практика"}`,
    description: "Последовательный блок учебных тем и практических занятий.",
    topics: Array.from({ length: 2 }, (_, topicIndex) => ({
      id: `${id}-topic-${moduleIndex + 1}-${topicIndex + 1}`,
      title: `Тема ${moduleIndex + 1}.${topicIndex + 1}`,
      lessonIds: Array.from({ length: 5 }, (_, lessonIndex) => `${id}-lesson-${moduleIndex + 1}-${topicIndex + 1}-${lessonIndex + 1}`),
    })),
  })),
}));

export const mockCourses: Course[] = [...baseCourses, ...generatedCourses];
