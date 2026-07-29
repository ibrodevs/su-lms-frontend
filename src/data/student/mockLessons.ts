import type { Lesson } from "../../types/student";

export const mockLessons: Lesson[] = [
  {
    id: "dl-intro",
    courseId: "digital-literacy",
    moduleId: "dl-foundations",
    topicId: "dl-digital-world",
    title: "Цифровая среда университета",
    description: "Знакомство с основными цифровыми сервисами и правилами работы в SU LMS.",
    durationMinutes: 12,
    contentType: "mixed",
    content: `## Цель урока

После урока вы сможете уверенно ориентироваться в цифровой среде университета и выбирать подходящий сервис для каждой учебной задачи.

### Основные сервисы

- **SU LMS** — курсы, уроки и учебные материалы;
- **Электронная библиотека** — книги и научные публикации;
- **Корпоративная почта** — официальная коммуникация;
- **Облачное хранилище** — совместная работа с файлами.

> Используйте университетскую учётную запись только на доверенных устройствах и всегда завершайте сессию на общих компьютерах.`,
    materialIds: ["dl-campus-guide", "dl-services-map"],
    video: {
      kind: "youtube",
      title: "Обзор цифровой среды SU",
      description: "Короткое знакомство с сервисами, которые понадобятся в течение семестра.",
      embedUrl: "https://www.youtube.com/embed/UB1O30fR-EE",
    },
  },
  {
    id: "dl-security",
    courseId: "digital-literacy",
    moduleId: "dl-foundations",
    topicId: "dl-digital-world",
    title: "Безопасность учётной записи",
    description: "Пароли, двухфакторная аутентификация и защита персональных данных.",
    durationMinutes: 18,
    contentType: "rich-text",
    content: `## Простые правила безопасности

1. Используйте уникальный пароль длиной не менее 12 символов.
2. Не передавайте коды подтверждения другим людям.
3. Проверяйте адрес сайта перед вводом пароля.
4. Сообщайте в поддержку о подозрительных письмах.

### Пример сильной парольной фразы

\`Sunrise-Campus-2026!\`

Парольная фраза должна быть запоминаемой для вас, но не связанной с публичными личными данными.`,
    materialIds: ["dl-security-checklist"],
    requiresLessonId: "dl-intro",
  },
  {
    id: "dl-files",
    courseId: "digital-literacy",
    moduleId: "dl-productivity",
    topicId: "dl-file-work",
    title: "Работа с файлами и форматами",
    description: "Организация файлов, понятные названия и выбор формата документа.",
    durationMinutes: 22,
    contentType: "mixed",
    content: `## Организация файлов

Используйте предсказуемую структуру папок и добавляйте дату или версию в название файла.

### Рекомендуемый формат

\`course-topic-task-v2.pdf\`

PDF подходит для финальной передачи, DOCX — для редактирования, PPTX — для презентаций.`,
    materialIds: ["dl-file-formats", "dl-presentation-template"],
    requiresLessonId: "dl-security",
    video: {
      kind: "placeholder",
      title: "Организация учебных файлов",
      description: "Видео временно недоступно. Текст урока и материалы доступны ниже.",
    },
  },
  {
    id: "dl-collaboration",
    courseId: "digital-literacy",
    moduleId: "dl-productivity",
    topicId: "dl-file-work",
    title: "Совместная работа",
    description: "Комментарии, версии документов и распределение ответственности в команде.",
    durationMinutes: 20,
    contentType: "rich-text",
    content: `## Совместная работа без конфликтов

- назначьте владельца документа;
- договоритесь о формате комментариев;
- не создавайте параллельные копии без необходимости;
- перед сдачей проверьте историю изменений.`,
    materialIds: ["dl-collaboration-audio"],
    requiresLessonId: "dl-files",
  },
  {
    id: "dl-research",
    courseId: "digital-literacy",
    moduleId: "dl-research-module",
    topicId: "dl-search",
    title: "Поиск надёжных источников",
    description: "Критерии качества источника и эффективные поисковые запросы.",
    durationMinutes: 26,
    contentType: "mixed",
    content: `## Проверка источника

Оцените автора, дату публикации, издателя, ссылки на первичные данные и возможный конфликт интересов.

### Поисковый оператор

\`site:edu.kg "цифровая грамотность"\`

Такой запрос ограничивает результаты образовательными доменами Кыргызстана.`,
    materialIds: ["dl-library-link", "dl-source-evaluation"],
    requiresLessonId: "dl-collaboration",
  },
  {
    id: "dl-citations",
    courseId: "digital-literacy",
    moduleId: "dl-research-module",
    topicId: "dl-search",
    title: "Цитирование и академическая честность",
    description: "Как использовать чужие идеи корректно и избегать плагиата.",
    durationMinutes: 24,
    contentType: "rich-text",
    content: `## Академическая честность

Цитируйте прямые высказывания, пересказы и данные, которые не являются общеизвестными. Сохраняйте сведения об источнике сразу во время исследования.`,
    materialIds: ["dl-citation-guide"],
    requiresLessonId: "dl-research",
  },
  {
    id: "dl-presentation",
    courseId: "digital-literacy",
    moduleId: "dl-communication",
    topicId: "dl-presenting",
    title: "Структура учебной презентации",
    description: "Сюжет презентации, визуальная иерархия и работа с диаграммами.",
    durationMinutes: 28,
    contentType: "mixed",
    content: `## Структура презентации

1. Контекст и проблема.
2. Основная идея.
3. Доказательства и примеры.
4. Вывод и следующий шаг.

Один слайд должен раскрывать одну ключевую мысль.`,
    materialIds: ["dl-presentation-template", "dl-presentation-example"],
    requiresLessonId: "dl-citations",
  },
  {
    id: "dl-final",
    courseId: "digital-literacy",
    moduleId: "dl-communication",
    topicId: "dl-presenting",
    title: "Итоговый практикум",
    description: "Применение навыков курса в едином учебном сценарии.",
    durationMinutes: 35,
    contentType: "rich-text",
    content: `## Итоговый сценарий

Подберите надёжный источник, подготовьте краткий конспект, сохраните его в подходящем формате и представьте результаты в пяти слайдах.`,
    materialIds: ["dl-final-brief"],
    requiresLessonId: "dl-presentation",
  },
  {
    id: "aw-argument",
    courseId: "academic-writing",
    moduleId: "aw-basics",
    topicId: "aw-structure",
    title: "Тезис и аргументация",
    description: "Как сформулировать ясный тезис и поддержать его доказательствами.",
    durationMinutes: 30,
    contentType: "rich-text",
    content: "## Тезис\n\nХороший тезис конкретен, проверяем и определяет направление всего текста.",
    materialIds: [],
  },
  {
    id: "kh-nomads",
    courseId: "kyrgyz-history",
    moduleId: "kh-origins",
    topicId: "kh-culture",
    title: "Культура кочевых обществ",
    description: "Материальная культура, устная традиция и социальная организация.",
    durationMinutes: 32,
    contentType: "youtube",
    content: "## Ключевые понятия\n\nКочевая культура развивалась в тесной связи с природной средой и сезонными маршрутами.",
    materialIds: [],
    video: {
      kind: "youtube",
      title: "Кочевая культура Центральной Азии",
      description: "Вводная видеолекция.",
      embedUrl: "https://www.youtube.com/embed/Scxs7L0vhZ4",
    },
  },
  {
    id: "en-speaking",
    courseId: "english-b2",
    moduleId: "en-communication",
    topicId: "en-speaking-topic",
    title: "Giving a short presentation",
    description: "Useful phrases and structure for a confident academic presentation.",
    durationMinutes: 25,
    contentType: "rich-text",
    content: "## Presentation flow\n\nStart with context, signpost each section, and finish with one clear takeaway.",
    materialIds: [],
  },
];
