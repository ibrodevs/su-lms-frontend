import {
  Archive,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileEdit,
  FileText,
  Layers3,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CourseStatusBadge from "../../components/staff/CourseStatusBadge";
import { mockDepartments } from "../../data/mock/mockOrganization";
import { mockStaffUsers } from "../../data/mock/mockUsers";
import { useMockLoading } from "../../hooks/useMockLoading";
import {
  getCourseHistory,
  getVisibleCourses,
  subscribeCourseStore,
} from "../../services/courseService";
import { getCurrentStaffUser, getStaffSession } from "../../services/staffSession";
import type { CourseStatus } from "../../types/staff";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default function StaffDashboardPage() {
  const session = getStaffSession();
  const user = getCurrentStaffUser();
  const [revision, setRevision] = useState(0);
  const isLoading = useMockLoading();

  useEffect(() => subscribeCourseStore(() => setRevision((value) => value + 1)), []);

  const sessionRole = session?.role;
  const sessionUserId = session?.userId;
  const courses = useMemo(() => {
    void revision;
    return sessionRole && sessionUserId
      ? getVisibleCourses(sessionRole, sessionUserId)
      : [];
  }, [revision, sessionRole, sessionUserId]);
  const recentCourses = useMemo(
    () => [...courses].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4),
    [courses],
  );
  const recentHistory = useMemo(
    () =>
      recentCourses
        .flatMap((course) => getCourseHistory(course.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6),
    [recentCourses],
  );

  const countStatus = (status: CourseStatus) =>
    courses.filter((course) => course.status === status).length;
  const isTeacher = session?.role === "teacher";
  const department = mockDepartments.find((item) => item.id === user?.departmentId);
  const stats = isTeacher
    ? [
        { label: "Активные курсы", value: courses.filter((course) => course.status !== "archived").length, icon: BookOpen, color: "text-macaw-dark bg-macaw/10" },
        { label: "Черновики", value: countStatus("draft"), icon: FileEdit, color: "text-ash bg-mist" },
        { label: "На проверке", value: countStatus("under-review"), icon: Clock3, color: "text-warning-dark bg-warning/10" },
        { label: "Опубликовано", value: countStatus("published"), icon: CheckCircle2, color: "text-ecto-dark bg-ecto/10" },
        { label: "Уроков", value: courses.reduce((sum, course) => sum + course.lessonCount, 0), icon: Layers3, color: "text-navy bg-navy/5" },
        { label: "Материалов", value: courses.reduce((sum, course) => sum + course.materialCount, 0), icon: FileText, color: "text-macaw-dark bg-macaw/10" },
      ]
    : [
        { label: "Всего курсов", value: courses.length, icon: BookOpen, color: "text-macaw-dark bg-macaw/10" },
        { label: "Черновики", value: countStatus("draft"), icon: FileEdit, color: "text-ash bg-mist" },
        { label: "На проверке", value: countStatus("under-review"), icon: Clock3, color: "text-warning-dark bg-warning/10" },
        { label: "Опубликовано", value: countStatus("published"), icon: CheckCircle2, color: "text-ecto-dark bg-ecto/10" },
        { label: "В архиве", value: countStatus("archived"), icon: Archive, color: "text-navy bg-navy/5" },
      ];

  if (isLoading) {
    return (
      <div aria-label="Загрузка рабочего стола" className="grid gap-5">
        <div className="h-40 animate-pulse rounded-brand bg-mist" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => <div className="h-28 animate-pulse rounded-brand bg-mist" key={item} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 rounded-brand border-2 border-line bg-paper p-5 md:grid-cols-[1fr_auto] md:items-center lg:p-7">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">
            {isTeacher ? "Кабинет преподавателя" : "Управление SU LMS"}
          </span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">
            {user?.firstName}, добрый день
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ash">
            {isTeacher
              ? `${user?.position ?? "Преподаватель"} · ${department?.name ?? "Кафедра"}. Продолжайте подготовку назначенных курсов.`
              : "Контролируйте подготовку курсов, проверяйте содержание и управляйте публикацией."}
          </p>
        </div>
        <Link
          className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white"
          to="/courses/create"
        >
          <Plus aria-hidden="true" size={19} />
          Создать курс
        </Link>
      </section>

      <section aria-label="Статистика курсов" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {stats.map(({ color, icon: Icon, label, value }) => (
          <article className="rounded-brand border-2 border-line bg-paper p-4" key={label}>
            <span className={`grid size-10 place-items-center rounded-brand ${color}`}>
              <Icon aria-hidden="true" size={20} />
            </span>
            <strong className="mt-4 block text-3xl font-black text-navy">{value}</strong>
            <span className="mt-1 block text-xs font-bold text-ash">{label}</span>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <section className="rounded-brand border-2 border-line bg-paper p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-navy">
                {isTeacher ? "Мои курсы" : "Последние курсы"}
              </h2>
              <p className="mt-1 text-xs text-ash">Недавно изменённые учебные курсы</p>
            </div>
            <Link className="text-sm font-black text-macaw-dark hover:underline" to="/courses">
              Все курсы
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {recentCourses.map((course) => (
              <Link
                className="grid gap-3 rounded-brand border-2 border-line p-4 transition-colors hover:border-lingot hover:bg-eel/10 sm:grid-cols-[1fr_auto] sm:items-center"
                key={course.id}
                to={`/courses/${course.id}`}
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-macaw-dark">{course.code}</span>
                  <strong className="mt-1 block truncate text-sm font-black text-graphite">{course.title}</strong>
                  <span className="mt-2 block text-xs text-ash">
                    {course.moduleCount} модулей · {course.lessonCount} уроков · обновлён {dateFormatter.format(new Date(course.updatedAt))}
                  </span>
                </div>
                <CourseStatusBadge status={course.status} />
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-brand border-2 border-line bg-paper p-5">
          <h2 className="text-xl font-black text-navy">Последняя активность</h2>
          <p className="mt-1 text-xs text-ash">История изменений курсов</p>
          <div className="mt-5 grid gap-4">
            {recentHistory.map((event) => {
              const actor = mockStaffUsers.find((candidate) => candidate.id === event.userId);
              return (
                <div className="border-l-2 border-lingot pl-3" key={event.id}>
                  <strong className="block text-xs font-black text-graphite">{event.action}</strong>
                  <span className="mt-1 block text-[11px] leading-5 text-ash">
                    {actor ? `${actor.firstName} ${actor.lastName}` : "Пользователь"} · {dateFormatter.format(new Date(event.createdAt))}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
