export const learningKeys = {
  all: ["learning"] as const,
  structures: () => [...learningKeys.all, "structure"] as const,
  structure: (courseId: number) => [...learningKeys.structures(), courseId] as const,
  lessons: () => [...learningKeys.all, "lesson"] as const,
  lesson: (lessonId: number) => [...learningKeys.lessons(), lessonId] as const,
  materials: (lessonId: number) => [...learningKeys.lesson(lessonId), "materials"] as const,
  courseMaterialLists: (courseId: number) => [...learningKeys.all, "course-materials", courseId] as const,
  courseMaterials: (courseId: number, params: object) => [...learningKeys.courseMaterialLists(courseId), params] as const,
  scorm: (lessonId: number) => [...learningKeys.lesson(lessonId), "scorm"] as const,
};
