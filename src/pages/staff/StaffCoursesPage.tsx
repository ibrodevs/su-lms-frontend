import { ChevronLeft, ChevronRight, Eye, FilterX, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { courseKeys } from "../../api/courseKeys";
import { coursesApi } from "../../api/courses.api";
import type { CourseLanguage, CourseListParams, CourseStatus } from "../../api/courses.api";
import { useAuth } from "../../auth/useAuth";
import ApiCourseStatusBadge from "../../components/staff/ApiCourseStatusBadge";
import StatePanel from "../../components/student/StatePanel";
import { apiCourseStatusLabels } from "../../utils/courseDisplay";

const languageLabels: Record<CourseLanguage, string> = { ru: "Русский", ky: "Кыргызский", en: "English" };
const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
const courseStatuses = Object.keys(apiCourseStatusLabels) as CourseStatus[];

function getInitialStatus(value: string | null): CourseStatus | "" {
  return value && courseStatuses.includes(value as CourseStatus) ? value as CourseStatus : "";
}

export default function StaffCoursesPage() {
  const location = useLocation();
  const { can } = useAuth();
  const initialParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [search, setSearch] = useState(initialParams.get("q") ?? "");
  const [status, setStatus] = useState<CourseStatus | "">(getInitialStatus(initialParams.get("status")));
  const [language, setLanguage] = useState<CourseLanguage | "">("");
  const [ordering, setOrdering] = useState("-updated_at");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const deferredSearch = useDeferredValue(search.trim());
  const params = useMemo<CourseListParams>(() => ({
    page,
    pageSize,
    search: deferredSearch || undefined,
    status: status || undefined,
    language: language || undefined,
    ordering,
  }), [deferredSearch, language, ordering, page, pageSize, status]);
  const coursesQuery = useQuery({
    queryKey: courseKeys.list(params),
    queryFn: () => coursesApi.list(params),
    placeholderData: (previousData) => previousData,
  });
  const pageCount = Math.max(1, Math.ceil((coursesQuery.data?.count ?? 0) / pageSize));

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setLanguage("");
    setOrdering("-updated_at");
    setPage(1);
  };

  const updateFilter = (update: () => void) => {
    update();
    setPage(1);
  };

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Course Management</span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">Курсы</h1>
          <p className="mt-2 text-sm text-ash">Данные backend с серверной фильтрацией и пагинацией.</p>
        </div>
        {can("courses.create") ? <Link className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white" to="/courses/create"><Plus aria-hidden="true" size={19} /> Создать курс</Link> : null}
      </header>

      <section aria-label="Фильтры курсов" className="rounded-brand border-2 border-line bg-paper p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="relative xl:col-span-2">
            <span className="sr-only">Поиск по названию или коду</span>
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" size={18} />
            <input className="h-12 w-full rounded-brand border-2 border-line bg-paper pl-10 pr-3 text-sm font-bold outline-none focus:border-macaw" onChange={(event) => updateFilter(() => setSearch(event.target.value))} placeholder="Название, код или преподаватель" value={search} />
          </label>
          <FilterSelect label="Статус" onChange={(value) => updateFilter(() => setStatus(value as CourseStatus | ""))} value={status}>
            <option value="">Все статусы</option>
            {(Object.entries(apiCourseStatusLabels) as Array<[CourseStatus, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FilterSelect>
          <FilterSelect label="Язык" onChange={(value) => updateFilter(() => setLanguage(value as CourseLanguage | ""))} value={language}>
            <option value="">Все языки</option>
            {(Object.entries(languageLabels) as Array<[CourseLanguage, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FilterSelect>
          <FilterSelect label="Сортировка" onChange={(value) => updateFilter(() => setOrdering(value))} value={ordering}>
            <option value="-updated_at">Недавно обновлённые</option><option value="updated_at">Давно обновлённые</option><option value="title">Название: А–Я</option><option value="-title">Название: Я–А</option><option value="code">Код курса</option><option value="start_date">Дата начала</option><option value="status">Статус</option>
          </FilterSelect>
        </div>
        <div className="mt-3 flex flex-col gap-3 border-t-2 border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold leading-5 text-ash">Фильтры по факультету, кафедре, программе, семестру и преподавателю включатся после добавления backend-справочников.</p>
          <button className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-brand border-2 border-line px-4 text-xs font-black text-ash hover:border-lingot hover:text-graphite" onClick={resetFilters} type="button"><FilterX aria-hidden="true" size={16} /> Сбросить</button>
        </div>
      </section>

      {coursesQuery.isPending ? <StatePanel description="Получаем доступные вам курсы с сервера." kind="loading" title="Загрузка курсов" /> : coursesQuery.isError ? <StatePanel action={<button className="mt-2 text-sm font-black text-macaw-dark hover:underline" onClick={() => coursesQuery.refetch()} type="button">Повторить запрос</button>} description={coursesQuery.error.message} kind="error" title="Не удалось загрузить курсы" /> : coursesQuery.data.results.length === 0 ? <StatePanel action={<button className="mt-2 text-sm font-black text-macaw-dark hover:underline" onClick={resetFilters} type="button">Сбросить фильтры</button>} description="Измените параметры поиска или сбросьте фильтры." title="Курсы не найдены" /> : (
        <section className="overflow-hidden rounded-brand border-2 border-line bg-paper">
          <div className="flex items-center justify-between gap-4 border-b-2 border-line px-4 py-3">
            <span className="text-sm font-black text-graphite">Найдено: {coursesQuery.data.count}</span>
            <label className="flex items-center gap-2 text-xs font-bold text-ash">На странице <select aria-label="Количество курсов на странице" className="rounded-brand border-2 border-line bg-paper px-2 py-1.5 font-black text-graphite" onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} value={pageSize}>{[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
          </div>
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead className="bg-mist text-[10px] font-black uppercase tracking-wider text-ash"><tr><th className="px-4 py-3">Курс</th><th className="px-4 py-3">Факультет</th><th className="px-4 py-3">Семестр</th><th className="px-4 py-3">Преподаватель</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Обновлён</th><th className="px-4 py-3"><span className="sr-only">Действия</span></th></tr></thead>
              <tbody>{coursesQuery.data.results.map((course) => <tr className="border-t-2 border-line text-sm" key={course.id}><td className="px-4 py-4"><strong className="block font-black text-graphite">{course.title}</strong><span className="mt-1 block text-xs font-bold text-macaw-dark">{course.code} · {course.credits} кр.</span></td><td className="max-w-64 px-4 py-4 text-xs font-bold text-ash">{course.faculty.name}</td><td className="px-4 py-4 text-xs font-bold text-ash">{course.semester.name}</td><td className="px-4 py-4 text-xs font-bold text-ash">{course.teacher?.full_name ?? "Не назначен"}</td><td className="px-4 py-4"><ApiCourseStatusBadge status={course.status} /></td><td className="px-4 py-4 text-xs font-bold text-ash">{dateFormatter.format(new Date(course.updated_at))}</td><td className="px-4 py-4"><Link aria-label={`Открыть курс ${course.title}`} className="ml-auto grid size-10 place-items-center rounded-brand border-2 border-line text-graphite hover:border-macaw hover:text-macaw-dark" to={`/courses/${course.id}`}><Eye aria-hidden="true" size={17} /></Link></td></tr>)}</tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 xl:hidden">{coursesQuery.data.results.map((course) => <article className="rounded-brand border-2 border-line p-4" key={course.id}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="text-[10px] font-black uppercase tracking-wider text-macaw-dark">{course.code}</span><h2 className="mt-1 text-base font-black text-graphite">{course.title}</h2></div><ApiCourseStatusBadge status={course.status} /></div><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="font-bold text-ash">Преподаватель</dt><dd className="mt-1 font-black text-graphite">{course.teacher?.full_name ?? "Не назначен"}</dd></div><div><dt className="font-bold text-ash">Семестр</dt><dd className="mt-1 font-black text-graphite">{course.semester.name}</dd></div></dl><Link className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-brand border-2 border-line text-xs font-black text-graphite hover:border-macaw" to={`/courses/${course.id}`}><Eye aria-hidden="true" size={16} /> Открыть</Link></article>)}</div>
          <div className="flex items-center justify-between gap-4 border-t-2 border-line px-4 py-3"><span className="text-xs font-bold text-ash">Страница {page} из {pageCount}</span><div className="flex gap-2"><button aria-label="Предыдущая страница" className="grid size-10 place-items-center rounded-brand border-2 border-line text-graphite disabled:opacity-40" disabled={!coursesQuery.data.previous || coursesQuery.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button"><ChevronLeft aria-hidden="true" size={18} /></button><button aria-label="Следующая страница" className="grid size-10 place-items-center rounded-brand border-2 border-line text-graphite disabled:opacity-40" disabled={!coursesQuery.data.next || coursesQuery.isFetching} onClick={() => setPage((current) => current + 1)} type="button"><ChevronRight aria-hidden="true" size={18} /></button></div></div>
        </section>
      )}
    </div>
  );
}

interface FilterSelectProps { children: React.ReactNode; label: string; onChange: (value: string) => void; value: string; }

function FilterSelect({ children, label, onChange, value }: FilterSelectProps) {
  return <label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-ash"><span>{label}</span><select className="h-12 rounded-brand border-2 border-line bg-paper px-3 text-sm font-bold normal-case tracking-normal text-graphite outline-none focus:border-macaw" onChange={(event) => onChange(event.target.value)} value={value}>{children}</select></label>;
}
