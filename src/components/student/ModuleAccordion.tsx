import { ChevronDown, Clock3, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type {
  Course,
  CourseModule,
  StudentProgressState,
} from "../../types/student";
import { getLessonById } from "../../services/studentCatalog";
import {
  getResolvedLessonStatus,
  isLessonLocked,
} from "../../services/studentProgress";
import CourseProgress from "./CourseProgress";
import StatusBadge from "./StatusBadge";

interface ModuleAccordionProps {
  course: Course;
  module: CourseModule;
  state: StudentProgressState;
  initiallyOpen?: boolean;
}

export default function ModuleAccordion({
  course,
  module,
  state,
  initiallyOpen = false,
}: ModuleAccordionProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const lessonIds = module.topics.flatMap((topic) => topic.lessonIds);
  const lessons = lessonIds
    .map((lessonId) => getLessonById(lessonId))
    .filter((lesson) => lesson !== null);
  const completed = lessons.filter(
    (lesson) => getResolvedLessonStatus(lesson, state) === "completed",
  ).length;
  const percent = lessons.length
    ? Math.round((completed / lessons.length) * 100)
    : 0;

  return (
    <section className="overflow-hidden rounded-brand border-2 border-line bg-paper">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-4 p-4 text-left hover:bg-mist sm:p-5"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-black text-navy sm:text-lg">
              {module.title}
            </h2>
            <span className="text-xs font-bold text-ash">
              {completed}/{lessons.length} уроков
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-ash">
            {module.description}
          </p>
          <div className="mt-3 max-w-sm">
            <CourseProgress
              compact
              label="Прогресс модуля"
              percent={percent}
            />
          </div>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={`mt-1 shrink-0 text-ash transition-transform ${isOpen ? "rotate-180" : ""}`}
          size={21}
        />
      </button>

      {isOpen && (
        <div className="border-t-2 border-line">
          {module.topics.map((topic) => (
            <div className="p-4 sm:p-5" key={topic.id}>
              <h3 className="mb-3 text-xs font-black uppercase tracking-[0.13em] text-ecto-dark">
                {topic.title}
              </h3>
              <div className="grid gap-2">
                {topic.lessonIds.map((lessonId, index) => {
                  const lesson = getLessonById(lessonId);
                  if (!lesson) return null;
                  const status = getResolvedLessonStatus(lesson, state);
                  const locked = isLessonLocked(lesson, state);
                  const content = (
                    <>
                      <span className="grid size-9 shrink-0 place-items-center rounded-brand border-2 border-line bg-mist text-xs font-black text-ash">
                        {locked ? (
                          <LockKeyhole aria-hidden="true" size={15} />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block text-sm font-black text-graphite">
                          {lesson.title}
                        </strong>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-ash">
                          <span className="flex items-center gap-1">
                            <Clock3 aria-hidden="true" size={13} />
                            {lesson.durationMinutes} мин
                          </span>
                          <span>· {lesson.contentType}</span>
                        </span>
                        {locked && (
                          <span className="mt-1 block text-[11px] font-bold text-danger">
                            Завершите предыдущий урок, чтобы открыть этот.
                          </span>
                        )}
                      </span>
                      <StatusBadge className="shrink-0" status={status} />
                    </>
                  );

                  return locked ? (
                    <div
                      aria-disabled="true"
                      className="flex items-start gap-3 rounded-brand border-2 border-transparent p-3 opacity-75"
                      key={lesson.id}
                    >
                      {content}
                    </div>
                  ) : (
                    <Link
                      className="flex items-start gap-3 rounded-brand border-2 border-transparent p-3 hover:border-lingot hover:bg-ecto/5"
                      key={lesson.id}
                      to={`/student/courses/${course.id}/lessons/${lesson.id}`}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
