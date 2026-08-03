import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Mail,
  Play,
  Star,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import CourseProgress from "../../components/student/CourseProgress";
import MaterialCard from "../../components/student/MaterialCard";
import ModuleAccordion from "../../components/student/ModuleAccordion";
import StatePanel from "../../components/student/StatePanel";
import StatusBadge from "../../components/student/StatusBadge";
import { useStudentProgress } from "../../hooks/useStudentProgress";
import {
  getCourseById,
  getMaterialsForCourse,
} from "../../services/studentCatalog";
import {
  getCourseProgress,
  getNextAvailableLesson,
} from "../../services/studentProgress";

interface CourseRouteParams {
  courseId: string;
}

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function StudentCoursePage() {
  const { courseId } = useParams<CourseRouteParams>();
  const { state } = useStudentProgress();
  const course = getCourseById(courseId);

  if (!course) {
    return (
      <StatePanel
        action={
          <Link
            className="student-pressable mt-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-2.5 text-sm font-black text-white"
            to="/student/courses"
          >
            Вернуться к курсам
          </Link>
        }
        description="Возможно, курс был удалён или ссылка устарела."
        kind="error"
        title="Курс не найден"
      />
    );
  }

  const progress = getCourseProgress(course, state);
  const nextLesson = getNextAvailableLesson(course, state);
  const courseMaterials = getMaterialsForCourse(course);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7">
      <nav aria-label="Хлебные крошки">
        <Link
          className="inline-flex items-center gap-2 text-xs font-black text-macaw-dark hover:underline"
          to="/student/courses"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Мои курсы
        </Link>
      </nav>

      <section className="overflow-hidden rounded-brand border-2 border-line bg-paper">
        <div className="grid lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="grid min-h-64 place-items-center border-b-2 border-line bg-ecto/10 p-6 lg:border-b-0 lg:border-r-2">
            <img
              alt=""
              className="h-56 w-full object-contain"
              src={course.coverImage}
            />
          </div>
          <div className="grid content-center gap-5 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-brand border-2 border-navy bg-navy/10 px-2.5 py-1 text-xs font-black text-navy">
                {course.code}
              </span>
              <StatusBadge status={progress.status} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-navy sm:text-4xl">
                {course.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ash">
                {course.description}
              </p>
            </div>
            <CourseProgress percent={progress.percent} />
            {nextLesson ? (
              <Link
                className="student-pressable inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 py-3 text-sm font-black text-white"
                to={`/student/courses/${course.id}/lessons/${nextLesson.id}`}
              >
                <Play aria-hidden="true" fill="currentColor" size={17} />
                Продолжить обучение
              </Link>
            ) : (
              <span className="inline-flex w-fit items-center gap-2 rounded-brand border-2 border-ecto bg-ecto/10 px-4 py-2 text-sm font-black text-ecto-dark">
                <Star aria-hidden="true" size={17} />
                Курс завершён
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="flex items-center gap-3 rounded-brand border-2 border-line p-4">
          <UserRound aria-hidden="true" className="text-macaw-dark" size={21} />
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-ash">
              Преподаватель
            </span>
            <strong className="text-sm font-black text-graphite">
              {course.instructor.name}
            </strong>
          </div>
        </article>
        <article className="flex items-center gap-3 rounded-brand border-2 border-line p-4">
          <GraduationCap
            aria-hidden="true"
            className="text-ecto-dark"
            size={21}
          />
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-ash">
              Кредиты
            </span>
            <strong className="text-sm font-black text-graphite">
              {course.credits} кредита
            </strong>
          </div>
        </article>
        <article className="flex items-center gap-3 rounded-brand border-2 border-line p-4">
          <BookOpen aria-hidden="true" className="text-navy" size={21} />
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-ash">
              Семестр
            </span>
            <strong className="text-sm font-black text-graphite">
              {course.semester}
            </strong>
          </div>
        </article>
        <article className="flex items-center gap-3 rounded-brand border-2 border-line p-4">
          <CalendarDays
            aria-hidden="true"
            className="text-warning"
            size={21}
          />
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-ash">
              Период
            </span>
            <strong className="text-xs font-black text-graphite">
              {dateFormatter.format(new Date(course.startDate))} —{" "}
              {dateFormatter.format(new Date(course.endDate))}
            </strong>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-brand border-2 border-line p-5">
          <h2 className="text-lg font-black text-navy">Syllabus</h2>
          <ul className="mt-4 grid gap-2">
            {course.syllabus.map((item) => (
              <li
                className="flex gap-2 text-sm leading-5 text-ash"
                key={item}
              >
                <ArrowRight
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-ecto-dark"
                  size={15}
                />
                {item}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-brand border-2 border-line p-5">
          <h2 className="text-lg font-black text-navy">О преподавателе</h2>
          <p className="mt-3 text-sm leading-6 text-ash">
            {course.instructor.bio}
          </p>
          <a
            className="mt-4 inline-flex items-center gap-2 text-xs font-black text-macaw-dark hover:underline"
            href={`mailto:${course.instructor.email}`}
          >
            <Mail aria-hidden="true" size={15} />
            {course.instructor.email}
          </a>
        </article>
        <article className="rounded-brand border-2 border-line p-5">
          <h2 className="text-lg font-black text-navy">Prerequisites</h2>
          {course.prerequisites.length ? (
            <ul className="mt-4 grid gap-2">
              {course.prerequisites.map((item) => (
                <li className="text-sm leading-5 text-ash" key={item}>
                  • {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ash">
              Предварительные требования отсутствуют.
            </p>
          )}
        </article>
      </section>

      <section className="grid gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.15em] text-ecto-dark">
            Учебный план
          </span>
          <h2 className="mt-1 text-2xl font-black text-navy">
            Структура курса
          </h2>
          <p className="mt-1 text-sm text-ash">
            Курс → модуль → тема → урок
          </p>
        </div>
        {course.modules.map((module, index) => (
          <ModuleAccordion
            course={course}
            initiallyOpen={index === 0}
            key={module.id}
            module={module}
            state={state}
          />
        ))}
      </section>

      {courseMaterials.length > 0 && (
        <section className="grid gap-4">
          <h2 className="text-2xl font-black text-navy">
            Общие материалы курса
          </h2>
          <div className="grid gap-3">
            {courseMaterials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
