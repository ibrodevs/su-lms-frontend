import type { Material } from "../../types/student";

const baseMaterials: Material[] = [
  {
    id: "dl-campus-guide",
    courseId: "digital-literacy",
    lessonId: "dl-intro",
    title: "Путеводитель по цифровой среде SU",
    description: "Краткая памятка по основным сервисам университета.",
    type: "pdf",
    size: "1.8 MB",
    pageCount: 12,
    url: "/materials/algorithms.pdf",
    downloadAllowed: true,
    availability: "available",
  },
  {
    id: "dl-services-map",
    courseId: "digital-literacy",
    lessonId: "dl-intro",
    title: "Карта цифровых сервисов",
    description: "Визуальная схема сервисов и способов входа.",
    type: "image",
    size: "220 KB",
    url: "/images/subjects/informatics.svg",
    downloadAllowed: true,
    availability: "available",
  },
  {
    id: "dl-security-checklist",
    courseId: "digital-literacy",
    lessonId: "dl-security",
    title: "Чек-лист безопасности",
    description: "DOCX-шаблон для проверки настроек учётной записи.",
    type: "docx",
    size: "12 KB",
    url: "/materials/security-checklist.docx",
    downloadAllowed: false,
    availability: "available",
  },
  {
    id: "dl-file-formats",
    courseId: "digital-literacy",
    lessonId: "dl-files",
    title: "Таблица форматов файлов",
    description: "Сравнение PDF, DOCX, PPTX и других учебных форматов.",
    type: "pdf",
    size: "610 KB",
    pageCount: 4,
    url: "/materials/discriminant.pdf",
    downloadAllowed: true,
    availability: "available",
  },
  {
    id: "dl-presentation-template",
    courseId: "digital-literacy",
    lessonId: "dl-presentation",
    title: "Шаблон учебной презентации",
    description: "PPTX-шаблон с готовой структурой слайдов.",
    type: "pptx",
    size: "61 KB",
    url: "/materials/presentation-template.pptx",
    downloadAllowed: true,
    availability: "available",
  },
  {
    id: "dl-legacy-archive",
    courseId: "digital-literacy",
    lessonId: "dl-files",
    title: "Архив старого учебного пакета",
    description:
      "Материал сохранён в формате, который не поддерживается текущей версией кабинета.",
    type: "other",
    size: "320 KB",
    downloadAllowed: false,
    availability: "unsupported",
  },
  {
    id: "dl-collaboration-audio",
    courseId: "digital-literacy",
    lessonId: "dl-collaboration",
    title: "Разбор командного сценария",
    description: "Аудиокомментарий преподавателя о совместной работе.",
    type: "audio",
    size: "4.1 MB",
    duration: "06:14",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    downloadAllowed: false,
    availability: "available",
  },
  {
    id: "dl-library-link",
    courseId: "digital-literacy",
    lessonId: "dl-research",
    title: "Электронная библиотека SU",
    description: "Каталог учебных и научных публикаций.",
    type: "library",
    url: "https://salymbekov.com",
    downloadAllowed: false,
    availability: "available",
  },
  {
    id: "dl-source-evaluation",
    courseId: "digital-literacy",
    lessonId: "dl-research",
    title: "CRAAP Test",
    description: "Внешняя методика оценки актуальности и надёжности источников.",
    type: "external",
    url: "https://library.csuchico.edu/sites/default/files/craap-test.pdf",
    downloadAllowed: false,
    availability: "available",
  },
  {
    id: "dl-citation-guide",
    courseId: "digital-literacy",
    lessonId: "dl-citations",
    title: "Руководство по цитированию",
    description: "Файл был удалён автором курса.",
    type: "pdf",
    downloadAllowed: false,
    availability: "deleted",
  },
  {
    id: "dl-presentation-example",
    courseId: "digital-literacy",
    lessonId: "dl-presentation",
    title: "Пример презентации",
    description: "Preview временно не загружается.",
    type: "pptx",
    downloadAllowed: false,
    availability: "error",
  },
  {
    id: "dl-final-brief",
    courseId: "digital-literacy",
    lessonId: "dl-final",
    title: "Бриф итогового практикума",
    description: "Материал станет доступен после завершения предыдущего урока.",
    type: "docx",
    downloadAllowed: false,
    availability: "unavailable",
  },
];

const generatedMaterials: Material[] = Array.from({ length: 16 }, (_, index) => {
  const courseIds = ["web-development", "database-systems", "software-testing", "project-management"];
  const courseId = courseIds[index % courseIds.length]!;
  const lessonNumber = (index % 20) + 1;
  const moduleIndex = Math.floor((lessonNumber - 1) / 10) + 1;
  const topicIndex = Math.floor(((lessonNumber - 1) % 10) / 5) + 1;
  const lessonIndex = ((lessonNumber - 1) % 5) + 1;
  const lessonId = `${courseId}-lesson-${moduleIndex}-${topicIndex}-${lessonIndex}`;
  const type = (["pdf", "doc", "docx", "ppt", "pptx", "image", "video", "text"] as const)[index % 8]!;
  return {
    id: `generated-material-${index + 1}`,
    courseId,
    lessonId,
    title: `Учебный материал ${index + 1}`,
    description: "Учебный файл для просмотра и скачивания материалов курса.",
    type,
    size: `${120 + index * 15} KB`,
    pageCount: type === "pdf" ? 4 + (index % 6) : undefined,
    url:
      type === "image"
        ? "/images/subjects/informatics.svg"
        : type === "doc" || type === "docx"
          ? "/materials/security-checklist.docx"
          : type === "ppt" || type === "pptx"
            ? "/materials/presentation-template.pptx"
            : type === "video"
              ? "https://www.w3schools.com/html/mov_bbb.mp4"
              : type === "text"
                ? undefined
                : "/materials/algorithms.pdf",
    addedAt: `2026-08-${String((index % 9) + 1).padStart(2, "0")}T10:00:00+06:00`,
    author: "Учебный отдел SU",
    downloadAllowed: index % 5 !== 0,
    availability: index % 9 === 0 ? "error" : "available",
  } satisfies Material;
});

export const mockMaterials: Material[] = [...baseMaterials, ...generatedMaterials];
