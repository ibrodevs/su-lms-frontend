import { mockSemesters } from "../data/mock/mockOrganization";
import { mockStaffUsers } from "../data/mock/mockUsers";
import type {
  Course,
  CourseLesson,
  CourseModule,
  CourseTopic,
  StaffMaterial,
} from "../types/staff";
import { getCourse } from "./courseService";
import { getCourseStructure } from "./courseStructureService";
import { getCourseMaterials } from "./materialService";

export type PreviewLessonStatus = "completed" | "available" | "locked";

export interface PreviewLesson {
  lesson: CourseLesson;
  materials: StaffMaterial[];
  status: PreviewLessonStatus;
  lockReason?: string;
}

export interface PreviewTopic {
  topic: CourseTopic;
  lessons: PreviewLesson[];
}

export interface PreviewModule {
  module: CourseModule;
  topics: PreviewTopic[];
}

export interface CoursePreviewModel {
  course: Course;
  teacherName: string;
  semesterName: string;
  modules: PreviewModule[];
  lessons: PreviewLesson[];
  completedLessonCount: number;
  totalLessonCount: number;
  progressPercent: number;
}

const previewDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.order - right.order);
}

function formatPreviewDate(value: string): string {
  return previewDateFormatter.format(new Date(`${value}T00:00:00`));
}

function getLockReason(
  lesson: CourseLesson,
  previousLesson: CourseLesson | undefined,
  completedLessonIds: ReadonlySet<string>,
  lessonTitles: ReadonlyMap<string, string>,
  now: Date,
): string | null {
  if (!lesson.available) return "Урок скрыт преподавателем.";

  if (lesson.releaseCondition.type === "date") {
    const availableFrom = lesson.releaseCondition.availableFrom;
    if (availableFrom && new Date(`${availableFrom}T00:00:00`).getTime() > now.getTime()) {
      return `Урок откроется ${formatPreviewDate(availableFrom)}.`;
    }
  }

  if (
    lesson.releaseCondition.type === "after-previous" &&
    previousLesson &&
    !completedLessonIds.has(previousLesson.id)
  ) {
    return "Завершите предыдущий урок.";
  }

  if (lesson.releaseCondition.type === "after-lesson") {
    const requiredLessonId = lesson.releaseCondition.afterLessonId;
    if (requiredLessonId && !completedLessonIds.has(requiredLessonId)) {
      const requiredTitle = lessonTitles.get(requiredLessonId);
      return requiredTitle
        ? `Завершите урок «${requiredTitle}».`
        : "Завершите обязательный предыдущий урок.";
    }
  }

  return null;
}

export function buildPreviewLessons(
  lessons: CourseLesson[],
  materials: StaffMaterial[],
  now = new Date(),
): PreviewLesson[] {
  const orderedLessons = [...lessons];
  const lessonTitles = new Map(orderedLessons.map((lesson) => [lesson.id, lesson.title]));
  const materialsByLesson = new Map<string, StaffMaterial[]>();

  for (const material of materials) {
    const lessonMaterials = materialsByLesson.get(material.lessonId) ?? [];
    lessonMaterials.push(material);
    materialsByLesson.set(material.lessonId, lessonMaterials);
  }

  for (const [lessonId, lessonMaterials] of materialsByLesson) {
    materialsByLesson.set(lessonId, sortByOrder(lessonMaterials));
  }

  const completedLessonIds = new Set<string>();
  const completionTarget = orderedLessons.length
    ? Math.max(1, Math.floor(orderedLessons.length * 0.2))
    : 0;

  for (let index = 0; index < orderedLessons.length; index += 1) {
    if (completedLessonIds.size >= completionTarget) break;
    const lesson = orderedLessons[index];
    if (!lesson) continue;
    const lockReason = getLockReason(
      lesson,
      orderedLessons[index - 1],
      completedLessonIds,
      lessonTitles,
      now,
    );
    if (!lockReason) completedLessonIds.add(lesson.id);
  }

  return orderedLessons.map((lesson, index) => {
    const lockReason = getLockReason(
      lesson,
      orderedLessons[index - 1],
      completedLessonIds,
      lessonTitles,
      now,
    );
    const status: PreviewLessonStatus = completedLessonIds.has(lesson.id)
      ? "completed"
      : lockReason
        ? "locked"
        : "available";

    return {
      lesson,
      materials: materialsByLesson.get(lesson.id) ?? [],
      status,
      ...(lockReason ? { lockReason } : {}),
    };
  });
}

export function getCoursePreview(courseId: string, now = new Date()): CoursePreviewModel | null {
  const course = getCourse(courseId);
  if (!course) return null;

  const structure = getCourseStructure(courseId);
  const materials = getCourseMaterials(courseId);
  const orderedLessons = structure.modules.flatMap((module) =>
    sortByOrder(structure.topics.filter((topic) => topic.moduleId === module.id)).flatMap(
      (topic) => sortByOrder(structure.lessons.filter((lesson) => lesson.topicId === topic.id)),
    ),
  );
  const previewLessons = buildPreviewLessons(orderedLessons, materials, now);
  const previewLessonById = new Map(
    previewLessons.map((previewLesson) => [previewLesson.lesson.id, previewLesson]),
  );
  const modules = structure.modules.map((module) => ({
    module,
    topics: sortByOrder(structure.topics.filter((topic) => topic.moduleId === module.id)).map(
      (topic) => ({
        topic,
        lessons: sortByOrder(
          structure.lessons.filter((lesson) => lesson.topicId === topic.id),
        ).flatMap((lesson) => {
          const previewLesson = previewLessonById.get(lesson.id);
          return previewLesson ? [previewLesson] : [];
        }),
      }),
    ),
  }));
  const completedLessonCount = previewLessons.filter(
    (previewLesson) => previewLesson.status === "completed",
  ).length;
  const teacher = mockStaffUsers.find((user) => user.id === course.teacherId);
  const semester = mockSemesters.find((item) => item.id === course.semesterId);

  return {
    course,
    teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : "Преподаватель не назначен",
    semesterName: semester?.name ?? "Семестр не указан",
    modules,
    lessons: previewLessons,
    completedLessonCount,
    totalLessonCount: previewLessons.length,
    progressPercent: previewLessons.length
      ? Math.round((completedLessonCount / previewLessons.length) * 100)
      : 0,
  };
}
