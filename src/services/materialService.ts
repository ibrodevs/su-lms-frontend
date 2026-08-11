import type { MaterialInput, StaffMaterial, StaffStore } from "../types/staff";
import {
  appendCourseHistory,
  createStaffId,
  readStaffStore,
  updateCourseAggregates,
  writeStaffStore,
} from "./staffStore";
import { assertStaffCourseAccess } from "./staffAuthorization";

type Direction = "up" | "down";

function sortByOrder(materials: StaffMaterial[]): StaffMaterial[] {
  return [...materials].sort((left, right) => left.order - right.order);
}

function getCourseIdForLesson(store: StaffStore, lessonId: string): string | null {
  const lesson = store.lessons.find((candidate) => candidate.id === lessonId);
  if (!lesson) return null;
  const topic = store.topics.find((candidate) => candidate.id === lesson.topicId);
  if (!topic) return null;
  return store.modules.find((candidate) => candidate.id === topic.moduleId)?.courseId ?? null;
}

function persistMaterialChange(
  store: StaffStore,
  courseId: string,
  userId: string,
  action: string,
  details: string,
): void {
  assertStaffCourseAccess(store, courseId, userId);
  updateCourseAggregates(store, courseId, userId);
  appendCourseHistory(store, courseId, userId, action, details);
  writeStaffStore(store);
}

function normalizeMaterialInput(input: MaterialInput): MaterialInput {
  return {
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    fileName: input.fileName?.trim() || undefined,
    url: input.url?.trim() || undefined,
  };
}

export function getAllMaterials(): StaffMaterial[] {
  return [...readStaffStore().materials].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getMaterial(materialId: string): StaffMaterial | null {
  return readStaffStore().materials.find((material) => material.id === materialId) ?? null;
}

export function getMaterialsForLesson(lessonId: string): StaffMaterial[] {
  return sortByOrder(readStaffStore().materials.filter((material) => material.lessonId === lessonId));
}

export function getCourseMaterials(courseId: string): StaffMaterial[] {
  const store = readStaffStore();
  const moduleIds = new Set(store.modules.filter((module) => module.courseId === courseId).map((module) => module.id));
  const topicIds = new Set(store.topics.filter((topic) => moduleIds.has(topic.moduleId)).map((topic) => topic.id));
  const lessonIds = new Set(store.lessons.filter((lesson) => topicIds.has(lesson.topicId)).map((lesson) => lesson.id));
  return store.materials.filter((material) => lessonIds.has(material.lessonId)).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function createMaterial(lessonId: string, input: MaterialInput, userId: string): StaffMaterial {
  const store = readStaffStore();
  const courseId = getCourseIdForLesson(store, lessonId);
  if (!courseId) throw new Error("LESSON_NOT_FOUND");
  const normalized = normalizeMaterialInput(input);
  if (!normalized.title) throw new Error("MATERIAL_TITLE_REQUIRED");
  const now = new Date().toISOString();
  const material: StaffMaterial = {
    id: createStaffId("material"),
    lessonId,
    ...normalized,
    order: store.materials.filter((candidate) => candidate.lessonId === lessonId).length + 1,
    createdAt: now,
    updatedAt: now,
  };
  store.materials.push(material);
  persistMaterialChange(store, courseId, userId, "Добавлен материал", material.title);
  return material;
}

export function updateMaterial(materialId: string, input: MaterialInput, userId: string): StaffMaterial {
  const store = readStaffStore();
  const index = store.materials.findIndex((material) => material.id === materialId);
  const existing = store.materials[index];
  if (!existing) throw new Error("MATERIAL_NOT_FOUND");
  const courseId = getCourseIdForLesson(store, existing.lessonId);
  if (!courseId) throw new Error("COURSE_NOT_FOUND");
  const normalized = normalizeMaterialInput(input);
  if (!normalized.title) throw new Error("MATERIAL_TITLE_REQUIRED");
  const updated: StaffMaterial = {
    ...existing,
    ...normalized,
    updatedAt: new Date().toISOString(),
  };
  store.materials[index] = updated;
  persistMaterialChange(store, courseId, userId, "Изменён материал", updated.title);
  return updated;
}

export function duplicateMaterial(materialId: string, userId: string): StaffMaterial {
  const store = readStaffStore();
  const source = store.materials.find((material) => material.id === materialId);
  if (!source) throw new Error("MATERIAL_NOT_FOUND");
  const courseId = getCourseIdForLesson(store, source.lessonId);
  if (!courseId) throw new Error("COURSE_NOT_FOUND");
  const now = new Date().toISOString();
  const duplicate: StaffMaterial = {
    ...source,
    id: createStaffId("material"),
    title: `${source.title} — копия`,
    order: store.materials.filter((material) => material.lessonId === source.lessonId).length + 1,
    createdAt: now,
    updatedAt: now,
  };
  store.materials.push(duplicate);
  persistMaterialChange(store, courseId, userId, "Материал продублирован", duplicate.title);
  return duplicate;
}

export function deleteMaterial(materialId: string, userId: string): void {
  const store = readStaffStore();
  const material = store.materials.find((candidate) => candidate.id === materialId);
  if (!material) throw new Error("MATERIAL_NOT_FOUND");
  const courseId = getCourseIdForLesson(store, material.lessonId);
  if (!courseId) throw new Error("COURSE_NOT_FOUND");
  store.materials = store.materials.filter((candidate) => candidate.id !== materialId);
  sortByOrder(store.materials.filter((candidate) => candidate.lessonId === material.lessonId)).forEach((candidate, index) => {
    candidate.order = index + 1;
  });
  persistMaterialChange(store, courseId, userId, "Удалён материал", material.title);
}

export function moveMaterial(materialId: string, direction: Direction, userId: string): boolean {
  const store = readStaffStore();
  const material = store.materials.find((candidate) => candidate.id === materialId);
  if (!material) return false;
  const courseId = getCourseIdForLesson(store, material.lessonId);
  if (!courseId) return false;
  const siblings = sortByOrder(store.materials.filter((candidate) => candidate.lessonId === material.lessonId));
  const currentIndex = siblings.findIndex((candidate) => candidate.id === materialId);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const target = siblings[targetIndex];
  if (!target) return false;
  const currentOrder = material.order;
  material.order = target.order;
  const storedTarget = store.materials.find((candidate) => candidate.id === target.id);
  if (!storedTarget) return false;
  storedTarget.order = currentOrder;
  persistMaterialChange(store, courseId, userId, "Изменён порядок материалов", material.title);
  return true;
}
