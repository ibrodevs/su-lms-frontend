import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, CalendarDays, GraduationCap, Play, Star, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { studentApi } from "../../api/student.api";
import { studentKeys } from "../../api/studentKeys";
import CourseProgress from "../../components/student/CourseProgress";
import MaterialCard from "../../components/student/MaterialCard";
import ModuleAccordion from "../../components/student/ModuleAccordion";
import StatePanel from "../../components/student/StatePanel";
import StatusBadge from "../../components/student/StatusBadge";
import type { CourseStatus } from "../../types/student";
import { flattenStudentLessons } from "../../utils/studentLearning";

interface CourseRouteParams {
  courseId: string;
}

type CourseTab = "overview" | "content" | "materials";

const courseTabs: Array<{ id: CourseTab; label: string }> = [
  { id: "overview", label: "Обзор" },
  { id: "content", label: "Содержание" },
  { id: "materials", label: "Материалы" },
];
const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

function resolveCourseStatus(progress: number): CourseStatus {
  if (progress >= 100) return "completed";
  if (progress > 0) return "in-progress";
  return "not-started";
}

export default function StudentCoursePage() {
  const { courseId: courseIdParam } = useParams<CourseRouteParams>();
  const [activeTab, setActiveTab] = useState<CourseTab>("overview");
  const courseId = Number(courseIdParam);
  const hasValidCourseId = Number.isInteger(courseId) && courseId > 0;
  const courseQuery = useQuery({
    enabled: hasValidCourseId,
    queryKey: studentKeys.course(courseId),
    queryFn: () => studentApi.course(courseId),
  });
  const progressQuery = useQuery({
    enabled: hasValidCourseId,
    queryKey: studentKeys.courseProgress(courseId),
    queryFn: () => studentApi.courseProgress(courseId),
  });

  if (!hasValidCourseId) return <CourseError description="Ссылка на курс содержит некорректный идентификатор." />;
  if (courseQuery.isPending || progressQuery.isPending) return <StatePanel description="Получаем курс, структуру, доступность уроков и прогресс с backend." kind="loading" title="Загрузка курса" />;
  if (courseQuery.isError || progressQuery.isError) return <CourseError description={(courseQuery.error ?? progressQuery.error)?.message ?? "Не удалось получить курс."} />;

  const course = courseQuery.data;
  const progress = progressQuery.data;
  const lessonContexts = flattenStudentLessons(course);
  const nextLesson = lessonContexts.find(({ lesson }) => lesson.is_available && lesson.status === "in_progress")
    ?? lessonContexts.find(({ lesson }) => lesson.is_available && lesson.status === "not_started");
  const materials = Array.from(
    new Map(
      lessonContexts.flatMap(({ lesson }) => lesson.materials.map((material) => [material.id, { lessonId: lesson.id, material }] as const)),
    ).values(),
  );
  const status = resolveCourseStatus(progress.progress_percent);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7">
      <Link className="inline-flex w-fit items-center gap-2 text-xs font-black text-macaw-dark hover:underline" to="/student/courses"><ArrowLeft aria-hidden="true" size={16} />Мои курсы</Link>

      <section className="overflow-hidden rounded-brand border-2 border-line bg-paper">
        <div className="grid lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="grid min-h-64 place-items-center border-b-2 border-line bg-ecto/10 lg:border-b-0 lg:border-r-2">
            {course.cover ? <img alt={`Обложка курса ${course.title}`} className="size-full max-h-72 object-cover" src={course.cover} /> : <BookOpen aria-hidden="true" className="text-ecto-dark" size={72} strokeWidth={1.4} />}
          </div>
          <div className="grid content-center gap-5 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-brand border-2 border-navy bg-navy/10 px-2.5 py-1 text-xs font-black text-navy">{course.code}</span><StatusBadge status={status} /></div>
            <div><h1 className="text-3xl font-black tracking-tight text-navy sm:text-4xl">{course.title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-ash">{course.description || "Описание курса пока не добавлено."}</p></div>
            <CourseProgress percent={progress.progress_percent} />
            {nextLesson ? <Link className="student-pressable inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 py-3 text-sm font-black text-white" to={`/student/courses/${course.id}/lessons/${nextLesson.lesson.id}`}><Play aria-hidden="true" fill="currentColor" size={17} />{nextLesson.lesson.status === "in_progress" ? "Продолжить обучение" : "Начать обучение"}</Link> : <span className="inline-flex w-fit items-center gap-2 rounded-brand border-2 border-ecto bg-ecto/10 px-4 py-2 text-sm font-black text-ecto-dark"><Star aria-hidden="true" size={17} />{progress.progress_percent === 100 ? "Курс завершён" : "Нет доступных уроков"}</span>}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CourseFact icon={UserRound} label="Преподаватель" value={course.teacher?.full_name ?? "Не назначен"} />
        <CourseFact icon={GraduationCap} label="Кредиты" value={String(course.credits)} />
        <CourseFact icon={BookOpen} label="Семестр" value={course.semester.name} />
        <CourseFact icon={CalendarDays} label="Период" value={`${dateFormatter.format(new Date(course.start_date))} — ${dateFormatter.format(new Date(course.end_date))}`} />
      </section>

      <nav aria-label="Разделы курса" className="flex max-w-full gap-2 overflow-x-auto border-b-2 border-line pb-3">
        {courseTabs.map((tab) => <button aria-pressed={activeTab === tab.id} className={activeTab === tab.id ? "shrink-0 rounded-brand border-2 border-ecto bg-ecto/10 px-4 py-2.5 text-xs font-black text-ecto-dark" : "shrink-0 rounded-brand border-2 border-line bg-paper px-4 py-2.5 text-xs font-black text-ash hover:bg-mist"} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">{tab.label}</button>)}
      </nav>

      {activeTab === "overview" ? <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-brand border-2 border-line p-5 lg:col-span-2"><h2 className="text-lg font-black text-navy">О курсе</h2><p className="mt-3 whitespace-pre-line text-sm leading-6 text-ash">{course.description || "Описание курса пока не добавлено."}</p></article>
        <article className="rounded-brand border-2 border-line p-5"><h2 className="text-lg font-black text-navy">Текущий результат</h2><div className="mt-4"><CourseProgress percent={progress.progress_percent} /></div><p className="mt-4 text-sm leading-6 text-ash">Завершено {progress.completed_lessons} из {progress.total_lessons} доступных уроков.</p></article>
        <article className="rounded-brand border-2 border-line p-5"><h2 className="text-lg font-black text-navy">Программа</h2><p className="mt-3 text-sm leading-6 text-ash">{course.program.name} · {course.department.name}</p></article>
        <article className="rounded-brand border-2 border-line p-5"><h2 className="text-lg font-black text-navy">Факультет</h2><p className="mt-3 text-sm leading-6 text-ash">{course.faculty.name}</p></article>
        <article className="rounded-brand border-2 border-line p-5"><h2 className="text-lg font-black text-navy">Структура</h2><p className="mt-3 text-sm leading-6 text-ash">{course.structure.length} модулей · {lessonContexts.length} уроков</p></article>
      </section> : null}

      {activeTab === "content" ? <section className="grid gap-4"><div><span className="text-xs font-black uppercase tracking-[0.15em] text-ecto-dark">Учебный план</span><h2 className="mt-1 text-2xl font-black text-navy">Структура курса</h2><p className="mt-1 text-sm text-ash">Доступность каждого урока определена backend.</p></div>{course.structure.length ? course.structure.map((module, index) => <ModuleAccordion courseId={course.id} initiallyOpen={index === 0} key={module.id} module={module} />) : <StatePanel description="В опубликованном курсе пока нет доступной структуры." title="Структура пуста" />}</section> : null}

      {activeTab === "materials" ? materials.length ? <section className="grid gap-4"><h2 className="text-2xl font-black text-navy">Доступные материалы курса</h2><div className="grid gap-3 md:grid-cols-2">{materials.map(({ lessonId, material }) => <MaterialCard courseId={course.id} key={material.id} lessonId={lessonId} material={material} />)}</div></section> : <StatePanel description="Backend не вернул материалы для доступных уроков этого курса." title="Материалов пока нет" /> : null}
    </div>
  );
}

function CourseFact({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) {
  return <article className="flex items-center gap-3 rounded-brand border-2 border-line p-4"><Icon aria-hidden="true" className="shrink-0 text-macaw-dark" size={21} /><div className="min-w-0"><span className="block text-[10px] font-black uppercase tracking-wider text-ash">{label}</span><strong className="block text-sm font-black text-graphite">{value}</strong></div></article>;
}

function CourseError({ description }: { description: string }) {
  return <StatePanel action={<Link className="student-pressable mt-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-2.5 text-sm font-black text-white" to="/student/courses">Вернуться к курсам</Link>} description={description} kind="error" title="Курс недоступен" />;
}
