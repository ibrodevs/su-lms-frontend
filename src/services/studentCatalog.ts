import { mockCalendarEvents } from "../data/student/mockCalendar";
import { mockCourses } from "../data/student/mockCourses";
import { mockLessons } from "../data/student/mockLessons";
import { mockMaterials } from "../data/student/mockMaterials";
import type { CalendarEvent, Course, Lesson, Material } from "../types/student";

const courseById = new Map(mockCourses.map((course) => [course.id, course]));
const lessonById = new Map(mockLessons.map((lesson) => [lesson.id, lesson]));
const materialById = new Map(mockMaterials.map((material) => [material.id, material]));

export function getCourseById(courseId: string): Course | null {
  return courseById.get(courseId) ?? null;
}

export function getLessonById(lessonId: string): Lesson | null {
  return lessonById.get(lessonId) ?? null;
}

export function getMaterialById(materialId: string): Material | null {
  return materialById.get(materialId) ?? null;
}

export function getLessonIdsForCourse(course: Course): string[] {
  return course.modules.flatMap((module) =>
    module.topics.flatMap((topic) => topic.lessonIds),
  );
}

export function getLessonsForCourse(course: Course): Lesson[] {
  return getLessonIdsForCourse(course)
    .map((lessonId) => getLessonById(lessonId))
    .filter((lesson): lesson is Lesson => lesson !== null);
}

export function getMaterialsForLesson(lesson: Lesson): Material[] {
  return lesson.materialIds
    .map((materialId) => getMaterialById(materialId))
    .filter((material): material is Material => material !== null);
}

export function getMaterialsForCourse(course: Course): Material[] {
  return course.materialIds
    .map((materialId) => getMaterialById(materialId))
    .filter((material): material is Material => material !== null);
}

export function getCourseForLesson(lesson: Lesson): Course | null {
  return getCourseById(lesson.courseId);
}

export function getCourseForMaterial(material: Material): Course | null {
  return getCourseById(material.courseId);
}

export function getLessonForMaterial(material: Material): Lesson | null {
  return material.lessonId ? getLessonById(material.lessonId) : null;
}

export function getAdjacentLessons(
  course: Course,
  lessonId: string,
): { previous: Lesson | null; next: Lesson | null } {
  const lessonIds = getLessonIdsForCourse(course);
  const index = lessonIds.indexOf(lessonId);

  if (index === -1) {
    return { previous: null, next: null };
  }

  const previousId = index > 0 ? lessonIds[index - 1] : undefined;
  const nextId = index < lessonIds.length - 1 ? lessonIds[index + 1] : undefined;

  return {
    previous: previousId ? getLessonById(previousId) : null,
    next: nextId ? getLessonById(nextId) : null,
  };
}

export function getEventsForCourse(courseId: string): CalendarEvent[] {
  return mockCalendarEvents.filter((event) => event.courseId === courseId);
}

export { mockCalendarEvents, mockCourses, mockLessons, mockMaterials };
