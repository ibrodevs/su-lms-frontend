import {
  Archive,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileEdit,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { courseKeys } from "../../api/courseKeys";
import { coursesApi } from "../../api/courses.api";
import type { CourseListParams, CourseStatus } from "../../api/courses.api";
import { getStaffRole } from "../../auth/roles";
import { useAuth } from "../../auth/useAuth";
import ApiCourseStatusBadge from "../../components/staff/ApiCourseStatusBadge";
import StatePanel from "../../components/student/StatePanel";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const statuses: CourseStatus[] = [
  "draft",
  "under_review",
  "needs_revision",
  "published",
  "archived",
];

const statusStats = [
  { color: "text-ash bg-mist", icon: FileEdit, label: "Черновики", status: "draft" },
  { color: "text-warning-dark bg-warning/10", icon: Clock3, label: "На проверке", status: "under_review" },
  { color: "text-orange-800 bg-orange-50", icon: RotateCcw, label: "На доработке", status: "needs_revision" },
  { color: "text-ecto-dark bg-ecto/10", icon: CheckCircle2, label: "Опубликовано", status: "published" },
  { color: "text-navy bg-navy/5", icon: Archive, label: "В архиве", status: "archived" },
] satisfies Array<{
  color: string;
  icon: typeof FileEdit;
  label: string;
  status: CourseStatus;
}>;

const recentParams: CourseListParams = { ordering: "-updated_at", pageSize: 4 };

function getCount(
  status: CourseStatus,
  queries: Array<{ data?: { count: number } }>,
): number {
  return queries[statuses.indexOf(status)]?.data?.count ?? 0;
}

export default function StaffDashboardPage() {
  const { can, user } = useAuth();
  const role = getStaffRole(user?.roles ?? []);
  const isTeacher = role === "teacher";
  const statusQueries = useQueries({
    queries: statuses.map((status) => {
      const params: CourseListParams = { pageSize: 1, status };
      return {
        queryFn: () => coursesApi.list(params),
        queryKey: courseKeys.list(params),
      };
    }),
  });
  const recentCoursesQuery = useQuery({
    queryFn: () => coursesApi.list(recentParams),
    queryKey: courseKeys.list(recentParams),
  });
  const isPending = recentCoursesQuery.isPending || statusQueries.some((query) => query.isPending);
  const failedQuery = statusQueries.find((query) => query.isError);
  const error = recentCoursesQuery.error ?? failedQuery?.error;
  const totalCourses = statusQueries.reduce((total, query) => total + (query.data?.count ?? 0), 0);
  const activeCourses = totalCourses - getCount("archived", statusQueries);

  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <StatePanel
        action={(
          <button
            className="mt-2 text-sm font-black text-macaw-dark hover:underline"
            onClick={() => {
              void recentCoursesQuery.refetch();
              statusQueries.forEach((query) => void query.refetch());
            }}
            type="button"
          >
            Повторить запрос
          </button>
        )}
        description={error.message}
        kind="error"
        title="Не удалось загрузить рабочий стол"
      />
    );
  }

  const recentCourses = recentCoursesQuery.data?.results ?? [];

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 rounded-brand border-2 border-line bg-paper p-5 md:grid-cols-[1fr_auto] md:items-center lg:p-7">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">
            {isTeacher ? "Кабинет преподавателя" : "Управление SU LMS"}
          </span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">
            {user?.first_name || user?.full_name || "Коллега"}, добрый день
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ash">
            {isTeacher
              ? "Продолжайте подготовку назначенных учебных курсов."
              : "Контролируйте подготовку курсов, проверяйте содержание и управляйте публикацией."}
          </p>
        </div>
        {can("courses.create") ? (
          <Link
            className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white"
            to="/courses/create"
          >
            <Plus aria-hidden="true" size={19} />
            Создать курс
          </Link>
        ) : null}
      </section>

      <section aria-label="Статистика курсов" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <DashboardStat
          color="text-macaw-dark bg-macaw/10"
          icon={BookOpen}
          label={isTeacher ? "Активные курсы" : "Всего курсов"}
          value={isTeacher ? activeCourses : totalCourses}
        />
        {statusStats.map((stat) => (
          <DashboardStat
            color={stat.color}
            icon={stat.icon}
            key={stat.status}
            label={stat.label}
            value={getCount(stat.status, statusQueries)}
          />
        ))}
      </section>

      <section className="rounded-brand border-2 border-line bg-paper p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-navy">
              {isTeacher ? "Мои курсы" : "Последние курсы"}
            </h2>
            <p className="mt-1 text-xs text-ash">Недавно изменённые курсы из backend</p>
          </div>
          <Link className="text-sm font-black text-macaw-dark hover:underline" to="/courses">
            Все курсы
          </Link>
        </div>

        {recentCourses.length ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {recentCourses.map((course) => (
              <Link
                className="grid gap-3 rounded-brand border-2 border-line p-4 transition-colors hover:border-lingot hover:bg-eel/10 sm:grid-cols-[1fr_auto] sm:items-center"
                key={course.id}
                to={`/courses/${course.id}`}
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-macaw-dark">
                    {course.code}
                  </span>
                  <strong className="mt-1 block truncate text-sm font-black text-graphite">
                    {course.title}
                  </strong>
                  <span className="mt-2 block text-xs text-ash">
                    {course.teacher?.full_name ?? "Преподаватель не назначен"} · обновлён {dateFormatter.format(new Date(course.updated_at))}
                  </span>
                </div>
                <ApiCourseStatusBadge status={course.status} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <StatePanel
              description="Backend не вернул курсы, доступные вашей роли."
              title="Курсов пока нет"
            />
          </div>
        )}
      </section>
    </div>
  );
}

interface DashboardStatProps {
  color: string;
  icon: typeof BookOpen;
  label: string;
  value: number;
}

function DashboardStat({ color, icon: Icon, label, value }: DashboardStatProps) {
  return (
    <article className="rounded-brand border-2 border-line bg-paper p-4">
      <span className={`grid size-10 place-items-center rounded-brand ${color}`}>
        <Icon aria-hidden="true" size={20} />
      </span>
      <strong className="mt-4 block text-3xl font-black text-navy">{value}</strong>
      <span className="mt-1 block text-xs font-bold text-ash">{label}</span>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-label="Загрузка рабочего стола" className="grid gap-5">
      <div className="h-40 animate-pulse rounded-brand bg-mist" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div className="h-28 animate-pulse rounded-brand bg-mist" key={item} />
        ))}
      </div>
    </div>
  );
}
