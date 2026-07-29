import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Play,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import CourseCard from "../../components/student/CourseCard";
import CourseProgress from "../../components/student/CourseProgress";
import PageHeading from "../../components/student/PageHeading";
import { mockStudent } from "../../data/student/mockStudent";
import { useStudentProgress } from "../../hooks/useStudentProgress";
import {
  getCourseById,
  getLessonById,
  mockCalendarEvents,
  mockCourses,
} from "../../services/studentCatalog";
import {
  getCourseProgress,
  getNextAvailableLesson,
} from "../../services/studentProgress";

const eventLabels = {
  "course-start": "Начало курса",
  "course-end": "Окончание курса",
  "module-open": "Новый модуль",
  "lesson-open": "Новый урок",
  "lesson-close": "Закрытие доступа",
} as const;

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});

export default function StudentDashboardPage() {
  const { state } = useStudentProgress();
  const courseSummaries = mockCourses.map((course) => ({
    course,
    progress: getCourseProgress(course, state),
  }));
  const activeCourses = courseSummaries.filter(
    ({ progress }) => progress.status === "in-progress",
  );
  const totalLessons = courseSummaries.reduce(
    (total, { progress }) => total + progress.total,
    0,
  );
  const completedLessons = courseSummaries.reduce(
    (total, { progress }) => total + progress.completed,
    0,
  );
  const overallPercent = totalLessons
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;
  const lastLesson = state.lastLessonId
    ? getLessonById(state.lastLessonId)
    : null;
  const lastCourse = lastLesson ? getCourseById(lastLesson.courseId) : null;
  const lastCourseContinuation = lastCourse
    ? getNextAvailableLesson(lastCourse, state)
    : null;
  const fallbackContinuation = activeCourses
    .map(({ course }) => ({
      course,
      lesson: getNextAvailableLesson(course, state),
    }))
    .find(({ lesson }) => lesson !== null);
  const continueLesson =
    lastCourseContinuation ?? fallbackContinuation?.lesson ?? null;
  const continueCourse = continueLesson
    ? getCourseById(continueLesson.courseId)
    : null;
  const continueProgress = continueCourse
    ? getCourseProgress(continueCourse, state)
    : null;
  const upcomingEvents = [...mockCalendarEvents]
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    )
    .slice(0, 4);

  const stats = [
    {
      icon: BookOpen,
      label: "Активные курсы",
      value: String(activeCourses.length),
      color: "border-macaw bg-macaw/10 text-macaw-dark",
    },
    {
      icon: CheckCircle2,
      label: "Завершённые уроки",
      value: String(completedLessons),
      color: "border-ecto bg-ecto/10 text-ecto-dark",
    },
    {
      icon: TrendingUp,
      label: "Общий прогресс",
      value: `${overallPercent}%`,
      color: "border-navy bg-navy/10 text-navy",
    },
    {
      icon: CalendarDays,
      label: "Ближайшие события",
      value: String(upcomingEvents.length),
      color: "border-warning bg-warning/10 text-graphite",
    },
  ];

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeading
        description={`${mockStudent.group} · ${mockStudent.semester}. Продолжайте обучение с последнего открытого урока.`}
        eyebrow="Главная"
        title={`Добро пожаловать, ${mockStudent.firstName}!`}
      />

      <section
        aria-label="Краткая статистика"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ color, icon: Icon, label, value }) => (
          <article
            className="flex items-center gap-4 rounded-brand border-2 border-line bg-paper p-4"
            key={label}
          >
            <span
              className={`grid size-12 shrink-0 place-items-center rounded-brand border-2 ${color}`}
            >
              <Icon aria-hidden="true" size={22} />
            </span>
            <div>
              <strong className="block text-2xl font-black text-navy">
                {value}
              </strong>
              <span className="text-xs font-bold text-ash">{label}</span>
            </div>
          </article>
        ))}
      </section>

      {continueCourse && continueLesson && continueProgress && (
        <section className="overflow-hidden rounded-brand border-2 border-ecto bg-ecto/5">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <span className="text-xs font-black uppercase tracking-[0.15em] text-ecto-dark">
                Продолжить обучение
              </span>
              <h2 className="mt-2 text-2xl font-black text-navy">
                {continueLesson.title}
              </h2>
              <p className="mt-1 text-sm font-bold text-ash">
                {continueCourse.title} · {continueCourse.code}
              </p>
              <div className="mt-4 max-w-xl">
                <CourseProgress percent={continueProgress.percent} />
              </div>
            </div>
            <Link
              className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 py-3 text-sm font-black text-white"
              to={`/student/courses/${continueCourse.id}/lessons/${continueLesson.id}`}
            >
              <Play aria-hidden="true" fill="currentColor" size={17} />
              Продолжить
            </Link>
          </div>
        </section>
      )}

      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.15em] text-ecto-dark">
              Учебный план
            </span>
            <h2 className="mt-1 text-2xl font-black text-navy">Мои курсы</h2>
          </div>
          <Link
            className="inline-flex items-center gap-1 text-sm font-black text-macaw-dark hover:underline"
            to="/student/courses"
          >
            Все курсы
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courseSummaries.slice(0, 3).map(({ course, progress }) => (
            <CourseCard course={course} key={course.id} progress={progress} />
          ))}
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.15em] text-ecto-dark">
              Расписание
            </span>
            <h2 className="mt-1 text-2xl font-black text-navy">
              Ближайшие события
            </h2>
          </div>
          <Link
            className="inline-flex items-center gap-1 text-sm font-black text-macaw-dark hover:underline"
            to="/student/calendar"
          >
            Календарь
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          {upcomingEvents.map((event) => {
            const course = getCourseById(event.courseId);
            const target = event.lessonId
              ? `/student/courses/${event.courseId}/lessons/${event.lessonId}`
              : `/student/courses/${event.courseId}`;

            return (
              <Link
                className="flex min-w-0 items-center gap-4 rounded-brand border-2 border-line bg-paper p-4 hover:border-lingot hover:bg-ecto/5"
                key={event.id}
                to={target}
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-center text-xs font-black leading-4 text-macaw-dark">
                  {dateFormatter.format(new Date(event.startsAt))}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-black text-navy">
                    {event.title}
                  </strong>
                  <span className="mt-1 block truncate text-xs font-bold text-ash">
                    {course?.title ?? "Курс"} · {eventLabels[event.type]}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="shrink-0 text-ash"
                  size={18}
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
