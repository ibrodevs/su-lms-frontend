import { mockCourses } from "./mockCourses";
import { mockLessons, mockModules, mockTopics } from "./mockStructure";
import type { StaffMaterial, StaffMaterialType } from "../../types/staff";

const materialTypes: StaffMaterialType[] = [
  "pdf",
  "docx",
  "pptx",
  "image",
  "audio",
  "video",
  "external",
  "library",
];

const fileMeta: Partial<Record<StaffMaterialType, { fileName: string; url?: string }>> = {
  pdf: { fileName: "course-guide.pdf", url: "/materials/algorithms.pdf" },
  docx: { fileName: "practice-checklist.docx", url: "/materials/security-checklist.docx" },
  pptx: { fileName: "lesson-slides.pptx", url: "/materials/presentation-template.pptx" },
  image: { fileName: "lesson-diagram.png" },
  audio: { fileName: "lecture-audio.mp3" },
  video: { fileName: "lesson-video.mp4" },
  external: { fileName: "", url: "https://developer.mozilla.org/" },
  library: { fileName: "", url: "https://library.su.edu.kg/" },
};

const typeLabels: Record<StaffMaterialType, string> = {
  pdf: "PDF-конспект",
  docx: "Рабочий документ",
  pptx: "Презентация",
  image: "Схема урока",
  audio: "Аудиолекция",
  video: "Видеоматериал",
  external: "Внешний ресурс",
  library: "Электронная библиотека",
};

function getCourseLessons(courseId: string) {
  const moduleIds = new Set(mockModules.filter((module) => module.courseId === courseId).map((module) => module.id));
  const topicIds = new Set(mockTopics.filter((topic) => moduleIds.has(topic.moduleId)).map((topic) => topic.id));
  return mockLessons.filter((lesson) => topicIds.has(lesson.topicId));
}

const materials: StaffMaterial[] = [];

mockCourses.forEach((course) => {
  const lessons = getCourseLessons(course.id);
  for (let index = 0; index < course.materialCount; index += 1) {
    const lesson = lessons[index % Math.max(lessons.length, 1)];
    if (!lesson) continue;
    const type = materialTypes[index % materialTypes.length] ?? "pdf";
    const meta = fileMeta[type];
    const timestamp = new Date(Date.UTC(2026, 7, 1 + (index % 10), 9, 0)).toISOString();
    materials.push({
      id: `${lesson.id}-material-${index + 1}`,
      lessonId: lesson.id,
      title: `${typeLabels[type]} ${index + 1}`,
      description: `Дополнительный материал к уроку «${lesson.title}».`,
      type,
      order: materials.filter((material) => material.lessonId === lesson.id).length + 1,
      fileName: meta?.fileName || undefined,
      sizeBytes: meta?.fileName ? 540_000 + index * 12_500 : undefined,
      url: meta?.url,
      pageCount: type === "pdf" ? 8 + (index % 12) : undefined,
      durationMinutes: type === "audio" || type === "video" ? 12 + (index % 18) : undefined,
      downloadAllowed: type !== "external" && type !== "library",
      availability: index % 13 === 12 ? "unavailable" : "available",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
});

export const mockStaffMaterials = materials;
