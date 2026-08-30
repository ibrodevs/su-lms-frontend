import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Play, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { studentApi } from "../../api/student.api";
import type { DashboardCourseDto, DashboardEventType } from "../../api/student.api";
import { studentKeys } from "../../api/studentKeys";
import { useAuth } from "../../auth/useAuth";
import CourseProgress from "../../components/student/CourseProgress";
import PageHeading from "../../components/student/PageHeading";
import StatePanel from "../../components/student/StatePanel";

const eventLabels: Record<DashboardEventType, string> = {
  course_start: "Начало курса",
  course_end: "Окончание курса",
  module_release: "Открытие модуля",
  lesson_release: "Открытие урока",
  custom: "Событие",
};
const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const dashboardQuery = useQuery({ queryKey: studentKeys.dashboard(), queryFn: studentApi.dashboard });
  if (dashboardQuery.isPending) return <StatePanel description="Получаем сводку, прогресс и ближайшие события с backend." kind="loading" title="Загрузка кабинета" />;
  if (dashboardQuery.isError) return <StatePanel description={dashboardQuery.error.message} kind="error" title="Кабинет недоступен" />;

  const dashboard = dashboardQuery.data;
  const continueLearning = dashboard.continue_learning;
  const continueCourse = dashboard.courses.find((course) => course.course_id === continueLearning.course_id);
  const totalLessons = dashboard.courses.reduce((total, course) => total + course.total_lessons, 0);
  const completedCourses = dashboard.courses.filter((course) => course.total_lessons > 0 && course.completed_lessons === course.total_lessons).length;
  const stats = [
    { icon: BookOpen, label: "Активные курсы", value: String(dashboard.active_courses), color: "border-macaw bg-macaw/10 text-macaw-dark" },
    { icon: CheckCircle2, label: "Завершённые курсы", value: String(completedCourses), color: "border-ecto bg-ecto/10 text-ecto-dark" },
    { icon: CheckCircle2, label: "Завершённые уроки", value: String(dashboard.completed_lessons), color: "border-ecto bg-ecto/10 text-ecto-dark" },
    { icon: BookOpen, label: "Всего уроков", value: String(totalLessons), color: "border-warning bg-warning/10 text-graphite" },
    { icon: TrendingUp, label: "Общий прогресс", value: `${dashboard.overall_progress}%`, color: "border-navy bg-navy/10 text-navy" },
    { icon: CalendarDays, label: "Ближайшие события", value: String(dashboard.upcoming_events.length), color: "border-macaw bg-macaw/10 text-macaw-dark" },
  ];

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeading description={`${user?.profile?.group ?? "Группа не указана"} · ${user?.profile?.student_id ?? "Student ID не указан"}. Данные синхронизированы с backend.`} eyebrow="Главная" title={`Добро пожаловать, ${user?.first_name || "студент"}!`} />
      <section aria-label="Краткая статистика" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{stats.map(({ color, icon: Icon, label, value }) => <article className="flex items-center gap-4 rounded-brand border-2 border-line bg-paper p-4" key={label}><span className={`grid size-12 shrink-0 place-items-center rounded-brand border-2 ${color}`}><Icon aria-hidden="true" size={22} /></span><div><strong className="block text-2xl font-black text-navy">{value}</strong><span className="text-xs font-bold text-ash">{label}</span></div></article>)}</section>

      {continueLearning.course_id && continueLearning.lesson_id ? <section className="overflow-hidden rounded-brand border-2 border-ecto bg-ecto/5"><div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center"><div className="min-w-0"><span className="text-xs font-black uppercase tracking-[0.15em] text-ecto-dark">Продолжить обучение</span><h2 className="mt-2 text-2xl font-black text-navy">{continueLearning.lesson_title}</h2><p className="mt-1 text-sm font-bold text-ash">{continueLearning.course_title}</p><p className="mt-1 text-xs font-bold text-ash">Статус: <strong className="text-graphite">{continueLearning.status === "in_progress" ? "В процессе" : "Не начат"}</strong></p><div className="mt-4 max-w-xl"><CourseProgress percent={continueCourse?.progress_percent ?? 0} /></div></div><Link className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 py-3 text-sm font-black text-white" to={`/student/courses/${continueLearning.course_id}/lessons/${continueLearning.lesson_id}`}><Play aria-hidden="true" fill="currentColor" size={17} /> Продолжить</Link></div></section> : <StatePanel description="Backend не нашёл доступный незавершённый урок." title="Обучение завершено или ещё не назначено" />}

      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4"><SectionHeading eyebrow="Учебный план" linkLabel="Все курсы" linkTo="/student/courses" title="Мои курсы" />{dashboard.courses.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{dashboard.courses.slice(0, 3).map((course) => <DashboardCourseCard course={course} key={course.course_id} />)}</div> : <StatePanel description="Backend не вернул опубликованные курсы с активным enrollment." title="Курсов пока нет" />}</section>

      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4"><SectionHeading eyebrow="Расписание" linkLabel="Календарь" linkTo="/student/calendar" title="Ближайшие события" />{dashboard.upcoming_events.length ? <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">{dashboard.upcoming_events.map((event) => { const course = dashboard.courses.find((item) => item.course_id === event.course_id); return <Link className="flex min-w-0 items-center gap-4 rounded-brand border-2 border-line bg-paper p-4 hover:border-lingot hover:bg-ecto/5" key={event.id} to={`/student/courses/${event.course_id}`}><span className="grid size-14 shrink-0 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-center text-xs font-black leading-4 text-macaw-dark">{dateFormatter.format(new Date(event.start_at))}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm font-black text-navy">{event.title}</strong><span className="mt-1 block truncate text-xs font-bold text-ash">{course?.title ?? `Курс #${event.course_id}`} · {eventLabels[event.event_type]}</span></span><ArrowRight aria-hidden="true" className="shrink-0 text-ash" size={18} /></Link>; })}</div> : <StatePanel description="Ближайшие доступные события отсутствуют." title="Событий пока нет" />}</section>
    </div>
  );
}

function DashboardCourseCard({ course }: { course: DashboardCourseDto }) {
  return <article className="flex min-w-0 flex-col rounded-brand border-2 border-line bg-paper p-5"><span className="text-xs font-black uppercase tracking-wider text-macaw-dark">{course.code}</span><h3 className="mt-2 line-clamp-2 text-lg font-black text-navy">{course.title}</h3><p className="mt-2 text-xs font-bold text-ash">{course.completed_lessons} из {course.total_lessons} уроков завершено</p><div className="mt-4"><CourseProgress compact percent={course.progress_percent} /></div><Link className="student-pressable mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white" to={`/student/courses/${course.course_id}`}>Открыть курс <ArrowRight aria-hidden="true" size={17} /></Link></article>;
}

function SectionHeading({ eyebrow, linkLabel, linkTo, title }: { eyebrow: string; linkLabel: string; linkTo: string; title: string }) {
  return <div className="flex items-end justify-between gap-4"><div><span className="text-xs font-black uppercase tracking-[0.15em] text-ecto-dark">{eyebrow}</span><h2 className="mt-1 text-2xl font-black text-navy">{title}</h2></div><Link className="inline-flex items-center gap-1 text-sm font-black text-macaw-dark hover:underline" to={linkTo}>{linkLabel}<ArrowRight aria-hidden="true" size={16} /></Link></div>;
}
