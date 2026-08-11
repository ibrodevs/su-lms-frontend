import { mockCourses } from "./mockCourses";
import type {
  CourseLesson,
  CourseModule,
  CourseTopic,
  LessonType,
  ReleaseCondition,
} from "../../types/staff";

const moduleNames = [
  "Введение и цели курса",
  "Основные концепции",
  "Инструменты и методы",
  "Практическая работа",
  "Проектный модуль",
  "Итоговое обобщение",
];

const topicNames = [
  "Ключевые понятия",
  "Разбор примеров",
  "Методология",
  "Практические инструменты",
  "Самостоятельная работа",
  "Контрольные вопросы",
];

const lessonTypes: LessonType[] = ["text", "video", "material", "mixed", "external-link"];

function distribute(total: number, buckets: number): number[] {
  if (buckets <= 0) return [];
  const base = Math.floor(total / buckets);
  const remainder = total % buckets;
  return Array.from({ length: buckets }, (_, index) => base + (index < remainder ? 1 : 0));
}

function getReleaseCondition(index: number, previousLessonId?: string): ReleaseCondition {
  if (index % 5 === 4) return { type: "date", availableFrom: "2026-10-01" };
  if (index % 5 === 3 && previousLessonId) {
    return { type: "after-lesson", afterLessonId: previousLessonId };
  }
  if (index > 0) return { type: "after-previous" };
  return { type: "always" };
}

const modules: CourseModule[] = [];
const topics: CourseTopic[] = [];
const lessons: CourseLesson[] = [];

mockCourses.forEach((course) => {
  const topicDistribution = distribute(course.topicCount, course.moduleCount);
  const lessonDistribution = distribute(course.lessonCount, Math.max(course.topicCount, 1));
  let courseTopicIndex = 0;
  let previousLessonId: string | undefined;

  for (let moduleIndex = 0; moduleIndex < course.moduleCount; moduleIndex += 1) {
    const moduleId = `${course.id}-module-${moduleIndex + 1}`;
    modules.push({
      id: moduleId,
      courseId: course.id,
      title: moduleNames[moduleIndex % moduleNames.length] ?? `Модуль ${moduleIndex + 1}`,
      description: `Раздел ${moduleIndex + 1} курса «${course.title}».`,
      order: moduleIndex + 1,
      openDate: moduleIndex === 0 ? course.startDate : undefined,
      closeDate: moduleIndex === course.moduleCount - 1 ? course.endDate : undefined,
      releaseCondition: moduleIndex === 0 ? { type: "always" } : { type: "after-previous" },
    });

    const topicsInModule = topicDistribution[moduleIndex] ?? 0;
    for (let topicIndex = 0; topicIndex < topicsInModule; topicIndex += 1) {
      const topicId = `${moduleId}-topic-${topicIndex + 1}`;
      topics.push({
        id: topicId,
        moduleId,
        title: topicNames[courseTopicIndex % topicNames.length] ?? `Тема ${courseTopicIndex + 1}`,
        description: `Тематический блок ${courseTopicIndex + 1}.`,
        order: topicIndex + 1,
      });

      const lessonsInTopic = lessonDistribution[courseTopicIndex] ?? 0;
      for (let lessonIndex = 0; lessonIndex < lessonsInTopic; lessonIndex += 1) {
        const lessonId = `${topicId}-lesson-${lessonIndex + 1}`;
        lessons.push({
          id: lessonId,
          topicId,
          title: `Урок ${courseTopicIndex + 1}.${lessonIndex + 1}: ${course.title}`,
          description: "Теория, пример и практическая часть урока.",
          type: lessonTypes[(courseTopicIndex + lessonIndex) % lessonTypes.length] ?? "text",
          durationMinutes: 20 + ((courseTopicIndex + lessonIndex) % 4) * 10,
          order: lessonIndex + 1,
          available: true,
          releaseCondition: getReleaseCondition(lessonIndex, previousLessonId),
          status: lessonIndex % 4 === 0 ? "draft" : "ready",
        });
        previousLessonId = lessonId;
      }
      courseTopicIndex += 1;
    }
  }
});

export const mockModules = modules;
export const mockTopics = topics;
export const mockLessons = lessons;
