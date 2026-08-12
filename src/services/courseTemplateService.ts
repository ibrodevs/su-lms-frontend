import { mockStaffUsers } from "../data/mock/mockUsers";
import type {
  Course,
  CourseInput,
  CourseTemplate,
  ReleaseCondition,
  StaffMaterial,
} from "../types/staff";
import { createCourse, isCourseCodeUnique } from "./courseService";
import {
  appendCourseHistory,
  createStaffId,
  readStaffStore,
  updateCourseAggregates,
  writeStaffStore,
} from "./staffStore";

export interface CourseTemplateStats {
  moduleCount: number;
  topicCount: number;
  lessonCount: number;
  materialCount: number;
}

function requireCopyPermission(userId: string): void {
  const actor = mockStaffUsers.find((user) => user.id === userId);
  if (!actor) throw new Error("STAFF_USER_NOT_FOUND");
  if (actor.role === "teacher") throw new Error("FORBIDDEN_COURSE_COPY");
}

function remapCondition(
  condition: ReleaseCondition,
  lessonIdMap: Map<string, string>,
): ReleaseCondition {
  if (condition.type !== "after-lesson" || !condition.afterLessonId) {
    return { ...condition };
  }
  return {
    ...condition,
    afterLessonId: lessonIdMap.get(condition.afterLessonId),
  };
}

function getNextCopyCode(sourceCode: string): string {
  const baseCode = `${sourceCode}-COPY`;
  if (isCourseCodeUnique(baseCode)) return baseCode;

  let suffix = 2;
  while (!isCourseCodeUnique(`${baseCode}-${suffix}`)) suffix += 1;
  return `${baseCode}-${suffix}`;
}

export function getCourseTemplates(): CourseTemplate[] {
  return readStaffStore().templates;
}

export function getCourseTemplate(templateId: string): CourseTemplate | null {
  return getCourseTemplates().find((template) => template.id === templateId) ?? null;
}

export function filterCourseTemplates(
  templates: CourseTemplate[],
  query: string,
): CourseTemplate[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return templates;
  return templates.filter((template) =>
    `${template.name} ${template.description}`.toLowerCase().includes(normalizedQuery),
  );
}

export function getCourseTemplateStats(template: CourseTemplate): CourseTemplateStats {
  let topicCount = 0;
  let lessonCount = 0;
  let materialCount = 0;
  for (const module of template.modules) {
    topicCount += module.topics.length;
    for (const topic of module.topics) {
      lessonCount += topic.lessons.length;
      for (const lesson of topic.lessons) materialCount += lesson.materials.length;
    }
  }
  return {
    moduleCount: template.modules.length,
    topicCount,
    lessonCount,
    materialCount,
  };
}

export function copyCourse(courseId: string, userId: string): Course {
  requireCopyPermission(userId);
  const store = readStaffStore();
  const source = store.courses.find((course) => course.id === courseId);
  if (!source) throw new Error("COURSE_NOT_FOUND");

  const now = new Date().toISOString();
  const copiedCourseId = createStaffId("course");
  const moduleIdMap = new Map<string, string>();
  const topicIdMap = new Map<string, string>();
  const lessonIdMap = new Map<string, string>();
  const sourceModules = store.modules.filter((module) => module.courseId === source.id);
  const sourceModuleIds = new Set(sourceModules.map((module) => module.id));
  const sourceTopics = store.topics.filter((topic) => sourceModuleIds.has(topic.moduleId));
  const sourceTopicIds = new Set(sourceTopics.map((topic) => topic.id));
  const sourceLessons = store.lessons.filter((lesson) => sourceTopicIds.has(lesson.topicId));
  const sourceLessonIds = new Set(sourceLessons.map((lesson) => lesson.id));
  const sourceMaterials = store.materials.filter((material) => sourceLessonIds.has(material.lessonId));

  for (const module of sourceModules) moduleIdMap.set(module.id, createStaffId("module"));
  for (const topic of sourceTopics) topicIdMap.set(topic.id, createStaffId("topic"));
  for (const lesson of sourceLessons) lessonIdMap.set(lesson.id, createStaffId("lesson"));

  const copiedCourse: Course = {
    ...source,
    id: copiedCourseId,
    title: `${source.title} (копия)`,
    code: getNextCopyCode(source.code),
    status: "draft",
    moduleCount: 0,
    topicCount: 0,
    lessonCount: 0,
    materialCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
    publishedAt: undefined,
    reviewComment: undefined,
  };

  store.courses.unshift(copiedCourse);
  store.modules.push(...sourceModules.map((module) => ({
    ...module,
    id: moduleIdMap.get(module.id) ?? createStaffId("module"),
    courseId: copiedCourseId,
    releaseCondition: remapCondition(module.releaseCondition, lessonIdMap),
  })));
  store.topics.push(...sourceTopics.map((topic) => ({
    ...topic,
    id: topicIdMap.get(topic.id) ?? createStaffId("topic"),
    moduleId: moduleIdMap.get(topic.moduleId) ?? topic.moduleId,
  })));
  store.lessons.push(...sourceLessons.map((lesson) => ({
    ...lesson,
    id: lessonIdMap.get(lesson.id) ?? createStaffId("lesson"),
    topicId: topicIdMap.get(lesson.topicId) ?? lesson.topicId,
    releaseCondition: remapCondition(lesson.releaseCondition, lessonIdMap),
  })));
  store.materials.push(...sourceMaterials.map((material) => ({
    ...material,
    id: createStaffId("material"),
    lessonId: lessonIdMap.get(material.lessonId) ?? material.lessonId,
    createdAt: now,
    updatedAt: now,
  })));
  updateCourseAggregates(store, copiedCourseId, userId);
  appendCourseHistory(
    store,
    copiedCourseId,
    userId,
    "Курс скопирован",
    `Создано из курса ${source.code}`,
  );
  writeStaffStore(store);
  return store.courses.find((course) => course.id === copiedCourseId) ?? copiedCourse;
}

export function createCourseFromTemplate(
  templateId: string,
  input: CourseInput,
  userId: string,
): Course {
  const template = getCourseTemplate(templateId);
  if (!template) throw new Error("COURSE_TEMPLATE_NOT_FOUND");
  const course = createCourse(input, userId);
  const store = readStaffStore();
  const now = new Date().toISOString();
  const lessonIdMap = new Map<string, string>();

  for (const module of template.modules) {
    for (const topic of module.topics) {
      for (const lesson of topic.lessons) {
        lessonIdMap.set(lesson.id, createStaffId("lesson"));
      }
    }
  }

  template.modules.forEach((module, moduleIndex) => {
    const moduleId = createStaffId("module");
    store.modules.push({
      id: moduleId,
      courseId: course.id,
      title: module.title,
      description: module.description,
      order: moduleIndex + 1,
      openDate: module.openDate,
      closeDate: module.closeDate,
      releaseCondition: remapCondition(module.releaseCondition, lessonIdMap),
    });

    module.topics.forEach((topic, topicIndex) => {
      const topicId = createStaffId("topic");
      store.topics.push({
        id: topicId,
        moduleId,
        title: topic.title,
        description: topic.description,
        order: topicIndex + 1,
      });

      topic.lessons.forEach((lesson, lessonIndex) => {
        const lessonId = lessonIdMap.get(lesson.id) ?? createStaffId("lesson");
        store.lessons.push({
          id: lessonId,
          topicId,
          title: lesson.title,
          description: lesson.description,
          type: lesson.type,
          durationMinutes: lesson.durationMinutes,
          order: lessonIndex + 1,
          available: lesson.available,
          releaseCondition: remapCondition(lesson.releaseCondition, lessonIdMap),
          status: lesson.status,
          content: lesson.content,
          videoKind: lesson.videoKind,
          videoUrl: lesson.videoUrl,
          videoTitle: lesson.videoTitle,
          videoDescription: lesson.videoDescription,
        });
        store.materials.push(...lesson.materials.map<StaffMaterial>((templateMaterial, materialIndex) => ({
          ...templateMaterial,
          id: createStaffId("material"),
          lessonId,
          order: materialIndex + 1,
          createdAt: now,
          updatedAt: now,
        })));
      });
    });
  });

  updateCourseAggregates(store, course.id, userId);
  appendCourseHistory(
    store,
    course.id,
    userId,
    "Курс создан из шаблона",
    template.name,
  );
  writeStaffStore(store);
  return store.courses.find((item) => item.id === course.id) ?? course;
}
