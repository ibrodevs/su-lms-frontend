import type {
  CourseLesson,
  CourseModule,
  CourseStructure,
  CourseTopic,
  LessonInput,
  ModuleInput,
  StaffStore,
  TopicInput,
} from "../types/staff";
import {
  appendCourseHistory,
  createStaffId,
  readStaffStore,
  updateCourseAggregates,
  writeStaffStore,
} from "./staffStore";
import { assertStaffCourseAccess } from "./staffAuthorization";

type Direction = "up" | "down";

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.order - right.order);
}

function getCourseIdForModule(store: StaffStore, moduleId: string): string | null {
  return store.modules.find((module) => module.id === moduleId)?.courseId ?? null;
}

function getCourseIdForTopic(store: StaffStore, topicId: string): string | null {
  const topic = store.topics.find((candidate) => candidate.id === topicId);
  return topic ? getCourseIdForModule(store, topic.moduleId) : null;
}

function getCourseIdForLesson(store: StaffStore, lessonId: string): string | null {
  const lesson = store.lessons.find((candidate) => candidate.id === lessonId);
  return lesson ? getCourseIdForTopic(store, lesson.topicId) : null;
}

function persistStructureChange(
  store: StaffStore,
  courseId: string,
  userId: string,
  action: string,
  details?: string,
): void {
  assertStaffCourseAccess(store, courseId, userId);
  updateCourseAggregates(store, courseId, userId);
  appendCourseHistory(store, courseId, userId, action, details);
  writeStaffStore(store);
}

function clearDeletedLessonDependencies(store: StaffStore, deletedLessonIds: Set<string>): void {
  store.modules.forEach((module) => {
    if (module.releaseCondition.afterLessonId && deletedLessonIds.has(module.releaseCondition.afterLessonId)) {
      module.releaseCondition = { type: "after-previous" };
    }
  });
  store.lessons.forEach((lesson) => {
    if (lesson.releaseCondition.afterLessonId && deletedLessonIds.has(lesson.releaseCondition.afterLessonId)) {
      lesson.releaseCondition = { type: "after-previous" };
    }
  });
}

function duplicateLessonMaterials(store: StaffStore, lessonIdMap: Map<string, string>): void {
  const now = new Date().toISOString();
  lessonIdMap.forEach((copiedLessonId, sourceLessonId) => {
    store.materials
      .filter((material) => material.lessonId === sourceLessonId)
      .forEach((material) => {
        store.materials.push({
          ...material,
          id: createStaffId("material"),
          lessonId: copiedLessonId,
          createdAt: now,
          updatedAt: now,
        });
      });
  });
}

function moveItem<T extends { id: string; order: number }>(
  collection: T[],
  siblings: T[],
  itemId: string,
  direction: Direction,
): boolean {
  const ordered = sortByOrder(siblings);
  const currentIndex = ordered.findIndex((item) => item.id === itemId);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const current = ordered[currentIndex];
  const target = ordered[targetIndex];
  if (!current || !target) return false;

  const currentOrder = current.order;
  const targetOrder = target.order;
  const storedCurrent = collection.find((item) => item.id === current.id);
  const storedTarget = collection.find((item) => item.id === target.id);
  if (!storedCurrent || !storedTarget) return false;
  storedCurrent.order = targetOrder;
  storedTarget.order = currentOrder;
  return true;
}

export function getCourseStructure(courseId: string): CourseStructure {
  const store = readStaffStore();
  const modules = sortByOrder(store.modules.filter((module) => module.courseId === courseId));
  const moduleIds = new Set(modules.map((module) => module.id));
  const topics = sortByOrder(store.topics.filter((topic) => moduleIds.has(topic.moduleId)));
  const topicIds = new Set(topics.map((topic) => topic.id));
  const lessons = sortByOrder(store.lessons.filter((lesson) => topicIds.has(lesson.topicId)));
  return { modules, topics, lessons };
}

export function getModule(moduleId: string): CourseModule | null {
  return readStaffStore().modules.find((module) => module.id === moduleId) ?? null;
}

export function getTopic(topicId: string): CourseTopic | null {
  return readStaffStore().topics.find((topic) => topic.id === topicId) ?? null;
}

export function getLesson(lessonId: string): CourseLesson | null {
  return readStaffStore().lessons.find((lesson) => lesson.id === lessonId) ?? null;
}

export function createModule(courseId: string, input: ModuleInput, userId: string): CourseModule {
  const store = readStaffStore();
  if (!store.courses.some((course) => course.id === courseId)) throw new Error("COURSE_NOT_FOUND");
  const siblings = store.modules.filter((module) => module.courseId === courseId);
  const module: CourseModule = {
    id: createStaffId("module"),
    courseId,
    title: input.title.trim(),
    description: input.description.trim(),
    order: siblings.length + 1,
    openDate: input.openDate,
    closeDate: input.closeDate,
    releaseCondition: { ...input.releaseCondition },
  };
  store.modules.push(module);
  persistStructureChange(store, courseId, userId, "Добавлен модуль", module.title);
  return module;
}

export function updateModule(moduleId: string, input: ModuleInput, userId: string): CourseModule {
  const store = readStaffStore();
  const index = store.modules.findIndex((module) => module.id === moduleId);
  const existing = store.modules[index];
  if (!existing) throw new Error("MODULE_NOT_FOUND");
  const updated: CourseModule = {
    ...existing,
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    releaseCondition: { ...input.releaseCondition },
  };
  store.modules[index] = updated;
  persistStructureChange(store, existing.courseId, userId, "Изменён модуль", updated.title);
  return updated;
}

export function duplicateModule(moduleId: string, userId: string): CourseModule {
  const store = readStaffStore();
  const source = store.modules.find((module) => module.id === moduleId);
  if (!source) throw new Error("MODULE_NOT_FOUND");
  const siblings = store.modules.filter((module) => module.courseId === source.courseId);
  const duplicate: CourseModule = {
    ...source,
    id: createStaffId("module"),
    title: `${source.title} — копия`,
    order: siblings.length + 1,
    releaseCondition: { ...source.releaseCondition },
  };
  store.modules.push(duplicate);

  const sourceTopics = sortByOrder(store.topics.filter((topic) => topic.moduleId === source.id));
  const lessonIdMap = new Map<string, string>();
  const copiedLessons: CourseLesson[] = [];
  sourceTopics.forEach((topic) => {
    const copiedTopic: CourseTopic = {
      ...topic,
      id: createStaffId("topic"),
      moduleId: duplicate.id,
    };
    store.topics.push(copiedTopic);
    sortByOrder(store.lessons.filter((lesson) => lesson.topicId === topic.id)).forEach((lesson) => {
      const copiedLesson: CourseLesson = {
        ...lesson,
        id: createStaffId("lesson"),
        topicId: copiedTopic.id,
        releaseCondition: { ...lesson.releaseCondition },
      };
      lessonIdMap.set(lesson.id, copiedLesson.id);
      copiedLessons.push(copiedLesson);
      store.lessons.push(copiedLesson);
    });
  });
  copiedLessons.forEach((lesson) => {
    const sourceLessonId = lesson.releaseCondition.afterLessonId;
    if (sourceLessonId && lessonIdMap.has(sourceLessonId)) {
      lesson.releaseCondition.afterLessonId = lessonIdMap.get(sourceLessonId);
    }
  });
  duplicateLessonMaterials(store, lessonIdMap);
  persistStructureChange(store, source.courseId, userId, "Модуль продублирован", duplicate.title);
  return duplicate;
}

export function deleteModule(moduleId: string, userId: string): void {
  const store = readStaffStore();
  const module = store.modules.find((candidate) => candidate.id === moduleId);
  if (!module) throw new Error("MODULE_NOT_FOUND");
  const topicIds = new Set(store.topics.filter((topic) => topic.moduleId === moduleId).map((topic) => topic.id));
  const lessonIds = new Set(store.lessons.filter((lesson) => topicIds.has(lesson.topicId)).map((lesson) => lesson.id));
  store.materials = store.materials.filter((material) => !lessonIds.has(material.lessonId));
  store.lessons = store.lessons.filter((lesson) => !topicIds.has(lesson.topicId));
  clearDeletedLessonDependencies(store, lessonIds);
  store.topics = store.topics.filter((topic) => topic.moduleId !== moduleId);
  store.modules = store.modules.filter((candidate) => candidate.id !== moduleId);
  sortByOrder(store.modules.filter((candidate) => candidate.courseId === module.courseId)).forEach((candidate, index) => {
    candidate.order = index + 1;
  });
  persistStructureChange(store, module.courseId, userId, "Удалён модуль", module.title);
}

export function moveModule(moduleId: string, direction: Direction, userId: string): boolean {
  const store = readStaffStore();
  const module = store.modules.find((candidate) => candidate.id === moduleId);
  if (!module) return false;
  const moved = moveItem(
    store.modules,
    store.modules.filter((candidate) => candidate.courseId === module.courseId),
    moduleId,
    direction,
  );
  if (moved) persistStructureChange(store, module.courseId, userId, "Изменён порядок модулей", module.title);
  return moved;
}

export function createTopic(moduleId: string, input: TopicInput, userId: string): CourseTopic {
  const store = readStaffStore();
  const courseId = getCourseIdForModule(store, moduleId);
  if (!courseId) throw new Error("MODULE_NOT_FOUND");
  const topic: CourseTopic = {
    id: createStaffId("topic"),
    moduleId,
    title: input.title.trim(),
    description: input.description.trim(),
    order: store.topics.filter((candidate) => candidate.moduleId === moduleId).length + 1,
  };
  store.topics.push(topic);
  persistStructureChange(store, courseId, userId, "Добавлена тема", topic.title);
  return topic;
}

export function updateTopic(topicId: string, input: TopicInput, userId: string): CourseTopic {
  const store = readStaffStore();
  const index = store.topics.findIndex((topic) => topic.id === topicId);
  const existing = store.topics[index];
  if (!existing) throw new Error("TOPIC_NOT_FOUND");
  const courseId = getCourseIdForModule(store, existing.moduleId);
  if (!courseId) throw new Error("COURSE_NOT_FOUND");
  const updated = { ...existing, title: input.title.trim(), description: input.description.trim() };
  store.topics[index] = updated;
  persistStructureChange(store, courseId, userId, "Изменена тема", updated.title);
  return updated;
}

export function duplicateTopic(topicId: string, userId: string): CourseTopic {
  const store = readStaffStore();
  const source = store.topics.find((topic) => topic.id === topicId);
  if (!source) throw new Error("TOPIC_NOT_FOUND");
  const courseId = getCourseIdForModule(store, source.moduleId);
  if (!courseId) throw new Error("COURSE_NOT_FOUND");
  const duplicate: CourseTopic = {
    ...source,
    id: createStaffId("topic"),
    title: `${source.title} — копия`,
    order: store.topics.filter((topic) => topic.moduleId === source.moduleId).length + 1,
  };
  store.topics.push(duplicate);
  const lessonIdMap = new Map<string, string>();
  const copiedLessons: CourseLesson[] = [];
  sortByOrder(store.lessons.filter((lesson) => lesson.topicId === source.id)).forEach((lesson) => {
    const copiedLesson: CourseLesson = {
      ...lesson,
      id: createStaffId("lesson"),
      topicId: duplicate.id,
      releaseCondition: { ...lesson.releaseCondition },
    };
    lessonIdMap.set(lesson.id, copiedLesson.id);
    copiedLessons.push(copiedLesson);
    store.lessons.push(copiedLesson);
  });
  copiedLessons.forEach((lesson) => {
    const sourceLessonId = lesson.releaseCondition.afterLessonId;
    if (sourceLessonId && lessonIdMap.has(sourceLessonId)) {
      lesson.releaseCondition.afterLessonId = lessonIdMap.get(sourceLessonId);
    }
  });
  duplicateLessonMaterials(store, lessonIdMap);
  persistStructureChange(store, courseId, userId, "Тема продублирована", duplicate.title);
  return duplicate;
}

export function deleteTopic(topicId: string, userId: string): void {
  const store = readStaffStore();
  const topic = store.topics.find((candidate) => candidate.id === topicId);
  if (!topic) throw new Error("TOPIC_NOT_FOUND");
  const courseId = getCourseIdForModule(store, topic.moduleId);
  if (!courseId) throw new Error("COURSE_NOT_FOUND");
  const lessonIds = new Set(store.lessons.filter((lesson) => lesson.topicId === topicId).map((lesson) => lesson.id));
  store.materials = store.materials.filter((material) => !lessonIds.has(material.lessonId));
  store.lessons = store.lessons.filter((lesson) => lesson.topicId !== topicId);
  clearDeletedLessonDependencies(store, lessonIds);
  store.topics = store.topics.filter((candidate) => candidate.id !== topicId);
  sortByOrder(store.topics.filter((candidate) => candidate.moduleId === topic.moduleId)).forEach((candidate, index) => {
    candidate.order = index + 1;
  });
  persistStructureChange(store, courseId, userId, "Удалена тема", topic.title);
}

export function moveTopic(topicId: string, direction: Direction, userId: string): boolean {
  const store = readStaffStore();
  const topic = store.topics.find((candidate) => candidate.id === topicId);
  if (!topic) return false;
  const courseId = getCourseIdForModule(store, topic.moduleId);
  if (!courseId) return false;
  const moved = moveItem(
    store.topics,
    store.topics.filter((candidate) => candidate.moduleId === topic.moduleId),
    topicId,
    direction,
  );
  if (moved) persistStructureChange(store, courseId, userId, "Изменён порядок тем", topic.title);
  return moved;
}

export function createLesson(topicId: string, input: LessonInput, userId: string): CourseLesson {
  const store = readStaffStore();
  const courseId = getCourseIdForTopic(store, topicId);
  if (!courseId) throw new Error("TOPIC_NOT_FOUND");
  const lesson: CourseLesson = {
    id: createStaffId("lesson"),
    topicId,
    title: input.title.trim(),
    description: input.description.trim(),
    type: input.type,
    durationMinutes: input.durationMinutes,
    order: store.lessons.filter((candidate) => candidate.topicId === topicId).length + 1,
    available: input.available,
    releaseCondition: { ...input.releaseCondition },
    status: input.status,
    content: input.content.trim(),
    videoKind: input.videoKind,
    videoUrl: input.videoUrl?.trim() || undefined,
    videoTitle: input.videoTitle?.trim() || undefined,
    videoDescription: input.videoDescription?.trim() || undefined,
  };
  store.lessons.push(lesson);
  persistStructureChange(store, courseId, userId, "Добавлен урок", lesson.title);
  return lesson;
}

export function updateLesson(lessonId: string, input: LessonInput, userId: string): CourseLesson {
  const store = readStaffStore();
  const index = store.lessons.findIndex((lesson) => lesson.id === lessonId);
  const existing = store.lessons[index];
  if (!existing) throw new Error("LESSON_NOT_FOUND");
  const courseId = getCourseIdForTopic(store, existing.topicId);
  if (!courseId) throw new Error("COURSE_NOT_FOUND");
  const updated: CourseLesson = {
    ...existing,
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    releaseCondition: { ...input.releaseCondition },
  };
  store.lessons[index] = updated;
  persistStructureChange(store, courseId, userId, "Изменён урок", updated.title);
  return updated;
}

export function duplicateLesson(lessonId: string, userId: string): CourseLesson {
  const store = readStaffStore();
  const source = store.lessons.find((lesson) => lesson.id === lessonId);
  if (!source) throw new Error("LESSON_NOT_FOUND");
  const courseId = getCourseIdForTopic(store, source.topicId);
  if (!courseId) throw new Error("COURSE_NOT_FOUND");
  const duplicate: CourseLesson = {
    ...source,
    id: createStaffId("lesson"),
    title: `${source.title} — копия`,
    order: store.lessons.filter((lesson) => lesson.topicId === source.topicId).length + 1,
    releaseCondition: { ...source.releaseCondition },
  };
  store.lessons.push(duplicate);
  duplicateLessonMaterials(store, new Map([[source.id, duplicate.id]]));
  persistStructureChange(store, courseId, userId, "Урок продублирован", duplicate.title);
  return duplicate;
}

export function deleteLesson(lessonId: string, userId: string): void {
  const store = readStaffStore();
  const lesson = store.lessons.find((candidate) => candidate.id === lessonId);
  if (!lesson) throw new Error("LESSON_NOT_FOUND");
  const courseId = getCourseIdForLesson(store, lessonId);
  if (!courseId) throw new Error("COURSE_NOT_FOUND");
  store.materials = store.materials.filter((material) => material.lessonId !== lessonId);
  store.lessons = store.lessons.filter((candidate) => candidate.id !== lessonId);
  clearDeletedLessonDependencies(store, new Set([lessonId]));
  sortByOrder(store.lessons.filter((candidate) => candidate.topicId === lesson.topicId)).forEach((candidate, index) => {
    candidate.order = index + 1;
  });
  persistStructureChange(store, courseId, userId, "Удалён урок", lesson.title);
}

export function moveLesson(lessonId: string, direction: Direction, userId: string): boolean {
  const store = readStaffStore();
  const lesson = store.lessons.find((candidate) => candidate.id === lessonId);
  if (!lesson) return false;
  const courseId = getCourseIdForTopic(store, lesson.topicId);
  if (!courseId) return false;
  const moved = moveItem(
    store.lessons,
    store.lessons.filter((candidate) => candidate.topicId === lesson.topicId),
    lessonId,
    direction,
  );
  if (moved) persistStructureChange(store, courseId, userId, "Изменён порядок уроков", lesson.title);
  return moved;
}
