import { ChevronDown, Clock3, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { StudentModuleDto } from "../../api/student.api";
import { resolveStudentLessonStatus, translateLockReason } from "../../utils/studentLearning";
import CourseProgress from "./CourseProgress";
import StatusBadge from "./StatusBadge";

interface ModuleAccordionProps {
  courseId: number;
  module: StudentModuleDto;
  initiallyOpen?: boolean;
}

export default function ModuleAccordion({ courseId, module, initiallyOpen = false }: ModuleAccordionProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const lessons = module.topics.flatMap((topic) => topic.lessons);
  const availableLessons = lessons.filter((lesson) => lesson.is_available);
  const completedLessons = availableLessons.filter((lesson) => lesson.status === "completed").length;
  const progress = availableLessons.length ? Math.round((completedLessons / availableLessons.length) * 100) : 0;

  return (
    <section className="overflow-hidden rounded-brand border-2 border-line bg-paper">
      <button aria-expanded={isOpen} className="flex w-full items-start justify-between gap-4 p-4 text-left hover:bg-mist sm:p-5" onClick={() => setIsOpen((current) => !current)} type="button">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-black text-navy sm:text-lg">{module.title}</h2><span className="text-xs font-bold text-ash">{completedLessons}/{availableLessons.length} доступных уроков</span></div>
          {module.description ? <p className="mt-1 text-xs leading-5 text-ash">{module.description}</p> : null}
          <div className="mt-3 max-w-sm"><CourseProgress compact label="Прогресс модуля" percent={progress} /></div>
        </div>
        <ChevronDown aria-hidden="true" className={`mt-1 shrink-0 text-ash transition-transform ${isOpen ? "rotate-180" : ""}`} size={21} />
      </button>

      {isOpen ? <div className="border-t-2 border-line">
        {module.topics.map((topic) => <div className="p-4 sm:p-5" key={topic.id}>
          <h3 className="mb-3 text-xs font-black uppercase tracking-[0.13em] text-ecto-dark">{topic.title}</h3>
          <div className="grid gap-2">
            {topic.lessons.map((lesson, index) => {
              const status = resolveStudentLessonStatus(lesson);
              const content = <>
                <span className="grid size-9 shrink-0 place-items-center rounded-brand border-2 border-line bg-mist text-xs font-black text-ash">{lesson.is_available ? index + 1 : <LockKeyhole aria-hidden="true" size={15} />}</span>
                <span className="min-w-0 flex-1"><strong className="block text-sm font-black text-graphite">{lesson.title}</strong><span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-ash"><span className="flex items-center gap-1"><Clock3 aria-hidden="true" size={13} />{lesson.estimated_duration_minutes ?? 0} мин</span><span>· {lesson.lesson_type}</span></span>{!lesson.is_available ? <span className="mt-1 block text-[11px] font-bold text-danger">{translateLockReason(lesson.lock_reason)}</span> : null}</span>
                <StatusBadge className="shrink-0" status={status} />
              </>;
              return lesson.is_available ? <Link className="flex items-start gap-3 rounded-brand border-2 border-transparent p-3 hover:border-lingot hover:bg-ecto/5" key={lesson.id} to={`/student/courses/${courseId}/lessons/${lesson.id}`}>{content}</Link> : <div aria-disabled="true" className="flex items-start gap-3 rounded-brand border-2 border-transparent p-3 opacity-75" key={lesson.id}>{content}</div>;
            })}
          </div>
        </div>)}
      </div> : null}
    </section>
  );
}
