import { ArrowRight, BookOpen, CalendarDays, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import type { Course, CourseProgressSummary } from "../../types/student";
import CourseProgress from "./CourseProgress";
import StatusBadge from "./StatusBadge";

interface CourseCardProps {
  course: Course;
  progress: CourseProgressSummary;
}

const accentClasses = {
  ecto: "border-ecto bg-ecto/10",
  macaw: "border-macaw bg-macaw/10",
  navy: "border-navy bg-navy/10",
  warning: "border-warning bg-warning/10",
} as const;

export default function CourseCard({ course, progress }: CourseCardProps) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-brand border-2 border-line bg-paper">
      <div
        className={`relative grid h-40 place-items-center overflow-hidden border-b-2 ${accentClasses[course.accent]}`}
      >
        <img
          alt=""
          className="h-32 w-40 object-contain transition-transform duration-200 group-hover:scale-105"
          src={course.coverImage}
        />
        <span className="absolute left-4 top-4 rounded-brand border-2 border-paper/80 bg-paper px-2.5 py-1 text-xs font-black text-navy">
          {course.code}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-lg font-black leading-6 text-navy">
              {course.title}
            </h2>
            <p className="mt-1 line-clamp-1 text-xs font-bold text-ash">
              {course.instructor.name}
            </p>
          </div>
          <StatusBadge status={progress.status} />
        </div>
        <div className="grid gap-2 text-xs font-bold text-ash">
          <span className="flex items-center gap-2">
            <GraduationCap aria-hidden="true" size={15} />
            {course.program}
          </span>
          <span className="flex items-center gap-2">
            <CalendarDays aria-hidden="true" size={15} />
            {course.semester}
          </span>
          <span className="flex items-center gap-2">
            <BookOpen aria-hidden="true" size={15} />
            {course.modules.length} мод. · {progress.total} ур.
          </span>
        </div>
        <CourseProgress percent={progress.percent} compact />
        <Link
          className="student-pressable mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-2.5 text-sm font-black text-white"
          to={`/student/courses/${course.id}`}
        >
          Открыть курс
          <ArrowRight aria-hidden="true" size={17} strokeWidth={2.5} />
        </Link>
      </div>
    </article>
  );
}
