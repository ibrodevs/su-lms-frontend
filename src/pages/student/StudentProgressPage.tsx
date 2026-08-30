import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CheckCircle2, Play, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { studentApi } from "../../api/student.api";
import type { StudentCourseDto, StudentCourseListParams } from "../../api/student.api";
import { studentKeys } from "../../api/studentKeys";
import CourseProgress from "../../components/student/CourseProgress";
import PageHeading from "../../components/student/PageHeading";
import StatePanel from "../../components/student/StatePanel";
import StatusBadge from "../../components/student/StatusBadge";
import { resolveStudentCourseStatus } from "../../components/student/resolveStudentCourseStatus";

const listParams: StudentCourseListParams = { pageSize: 100 };
const emptyCourses: StudentCourseDto[] = [];

export default function StudentProgressPage() {
  const progressQuery = useQuery({ queryKey: studentKeys.progress(), queryFn: studentApi.progress });
  const coursesQuery = useQuery({ queryKey: studentKeys.courses(listParams), queryFn: () => studentApi.courses(listParams) });

  if (progressQuery.isPending || coursesQuery.isPending) return <StatePanel description="Получаем общий прогресс и назначенные курсы с backend." kind="loading" title="Загрузка прогресса" />;
  if (progressQuery.isError || coursesQuery.isError) return <StatePanel description={(progressQuery.error ?? coursesQuery.error)?.message ?? "Не удалось получить прогресс."} kind="error" title="Прогресс недоступен" />;

  const progress = progressQuery.data;
  const courses = coursesQuery.data?.results ?? emptyCourses;
  const coursesById = new Map(courses.map((course) => [course.id, course]));
  const completedCourses = progress.courses.filter((course) => course.total_lessons > 0 && course.progress_percent === 100).length;
  const activeCourses = progress.courses.filter((course) => course.progress_percent > 0 && course.progress_percent < 100).length;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7">
      <PageHeading description="Backend рассчитывает прогресс только по доступным опубликованным урокам." eyebrow="Обучение" title="Мой прогресс" />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ProgressFact icon={TrendingUp} label="Общий прогресс" value={`${progress.progress_percent}%`} variant="ecto" />
        <ProgressFact icon={BookOpen} label="Всего курсов" value={String(progress.total_courses)} variant="macaw" />
        <ProgressFact icon={Play} label="Курсов в процессе" value={String(activeCourses)} variant="paper" />
        <ProgressFact icon={CheckCircle2} label="Завершено курсов" value={String(completedCourses)} variant="paper" />
      </section>

      <section className="rounded-brand border-2 border-line bg-paper p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Все курсы</span><h2 className="mt-1 text-2xl font-black text-navy">Детализация</h2></div><span className="text-sm font-bold text-ash">{progress.completed_lessons} из {progress.total_lessons} уроков завершено</span></div>
        <div className="mt-5"><CourseProgress percent={progress.progress_percent} /></div>
      </section>

      {progress.courses.length ? <section className="grid gap-4">
        {progress.courses.map((courseProgress) => {
          const course = coursesById.get(courseProgress.course_id);
          const status = resolveStudentCourseStatus(courseProgress);
          return <article className="grid gap-5 rounded-brand border-2 border-line bg-paper p-5 lg:grid-cols-[minmax(0,1fr)_240px_auto] lg:items-center" key={courseProgress.course_id}>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-black text-navy">{course?.title ?? `Курс #${courseProgress.course_id}`}</h3><StatusBadge status={status} /></div><p className="mt-1 text-xs font-bold text-ash">{course?.code ?? "Код не указан"} · {course?.teacher?.full_name ?? "Преподаватель не назначен"}</p><p className="mt-2 text-xs text-ash">Завершено {courseProgress.completed_lessons} из {courseProgress.total_lessons} доступных уроков</p></div>
            <CourseProgress compact percent={courseProgress.progress_percent} />
            <Link className="student-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-2.5 text-sm font-black text-white" to={`/student/courses/${courseProgress.course_id}`}>Открыть курс<ArrowRight aria-hidden="true" size={16} /></Link>
          </article>;
        })}
      </section> : <StatePanel description="Backend не вернул прогресс по активным зачислениям." title="Прогресс пока отсутствует" />}
    </div>
  );
}

function ProgressFact({ icon: Icon, label, value, variant }: { icon: typeof BookOpen; label: string; value: string; variant: "ecto" | "macaw" | "paper" }) {
  const color = variant === "ecto" ? "border-ecto bg-ecto/10 text-ecto-dark" : variant === "macaw" ? "border-macaw bg-macaw/10 text-macaw-dark" : "border-line bg-paper text-navy";
  return <article className={`rounded-brand border-2 p-5 ${color}`}><Icon aria-hidden="true" size={24} /><strong className="mt-4 block text-3xl font-black text-navy">{value}</strong><span className="text-xs font-bold text-ash">{label}</span></article>;
}
