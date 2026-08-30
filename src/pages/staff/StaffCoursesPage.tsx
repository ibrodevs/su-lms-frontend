import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Eye, FilterX, Plus, Search } from "lucide-react";
import { useDeferredValue, useMemo } from "react";
import type { ReactNode } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { courseKeys } from "../../api/courseKeys";
import { coursesApi } from "../../api/courses.api";
import type { CourseLanguage, CourseListParams, CourseStatus } from "../../api/courses.api";
import { organizationApi } from "../../api/organization.api";
import { referenceKeys } from "../../api/referenceKeys";
import { referencesApi } from "../../api/references.api";
import { useAuth } from "../../auth/useAuth";
import ApiCourseStatusBadge from "../../components/staff/ApiCourseStatusBadge";
import StatePanel from "../../components/student/StatePanel";
import { apiCourseStatusLabels } from "../../utils/courseDisplay";

const languageLabels: Record<CourseLanguage, string> = { ru: "Русский", ky: "Кыргызский", en: "English" };
const orderingOptions = [
  ["-updated_at", "Недавно обновлённые"],
  ["updated_at", "Давно обновлённые"],
  ["title", "Название: А–Я"],
  ["-title", "Название: Я–А"],
  ["code", "Код курса"],
  ["start_date", "Дата начала"],
  ["status", "Статус"],
] as const;
const courseStatuses = new Set(Object.keys(apiCourseStatusLabels) as CourseStatus[]);
const courseLanguages = new Set(Object.keys(languageLabels) as CourseLanguage[]);
const courseOrderings = new Set(orderingOptions.map(([value]) => value));
const pageSizes = new Set([10, 20, 50]);
const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" });

function positiveInteger(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function selectValue(value?: number): string {
  return value === undefined ? "" : String(value);
}

export default function StaffCoursesPage() {
  const history = useHistory();
  const location = useLocation();
  const { can } = useAuth();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const search = searchParams.get("q") ?? "";
  const deferredSearch = useDeferredValue(search.trim());
  const rawStatus = searchParams.get("status");
  const status = rawStatus && courseStatuses.has(rawStatus as CourseStatus) ? rawStatus as CourseStatus : undefined;
  const rawLanguage = searchParams.get("language");
  const language = rawLanguage && courseLanguages.has(rawLanguage as CourseLanguage) ? rawLanguage as CourseLanguage : undefined;
  const rawOrdering = searchParams.get("ordering");
  const ordering = rawOrdering && courseOrderings.has(rawOrdering as typeof orderingOptions[number][0]) ? rawOrdering : "-updated_at";
  const page = positiveInteger(searchParams.get("page")) ?? 1;
  const requestedPageSize = positiveInteger(searchParams.get("page_size"));
  const pageSize = requestedPageSize && pageSizes.has(requestedPageSize) ? requestedPageSize : 10;
  const semester = positiveInteger(searchParams.get("semester"));
  const faculty = positiveInteger(searchParams.get("faculty"));
  const department = positiveInteger(searchParams.get("department"));
  const program = positiveInteger(searchParams.get("program"));
  const teacher = positiveInteger(searchParams.get("teacher"));
  const canLoadTeachers = can("courses.create");

  const params = useMemo<CourseListParams>(() => ({
    page,
    pageSize,
    search: deferredSearch || undefined,
    status,
    language,
    semester,
    faculty,
    department,
    program,
    teacher,
    ordering,
  }), [deferredSearch, department, faculty, language, ordering, page, pageSize, program, semester, status, teacher]);
  const coursesQuery = useQuery({ queryKey: courseKeys.list(params), queryFn: () => coursesApi.list(params), placeholderData: (previousData) => previousData });
  const facultiesQuery = useQuery({ queryKey: referenceKeys.faculties, queryFn: organizationApi.faculties });
  const semestersQuery = useQuery({ queryKey: referenceKeys.semesters, queryFn: organizationApi.semesters });
  const departmentsQuery = useQuery({ queryKey: referenceKeys.departments(faculty), queryFn: () => organizationApi.departments(faculty), enabled: faculty !== undefined });
  const programsQuery = useQuery({ queryKey: referenceKeys.programs(department), queryFn: () => organizationApi.programs(department), enabled: department !== undefined });
  const teachersQuery = useQuery({ queryKey: referenceKeys.teachers, queryFn: referencesApi.teachers, enabled: canLoadTeachers });
  const pageCount = Math.max(1, Math.ceil((coursesQuery.data?.count ?? 0) / pageSize));

  const updateSearch = (updates: Record<string, string | undefined>, resetPage = true) => {
    const next = new URLSearchParams(location.search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (resetPage) next.delete("page");
    const query = next.toString();
    history.replace({ pathname: "/courses", search: query ? `?${query}` : "" });
  };
  const resetFilters = () => history.replace("/courses");

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Course Management</span><h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">Курсы</h1><p className="mt-2 text-sm text-ash">Серверная фильтрация, сортировка и пагинация по данным SU LMS.</p></div>
        {can("courses.create") ? <Link className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white" to="/courses/create"><Plus aria-hidden="true" size={19} /> Создать курс</Link> : null}
      </header>

      <section aria-label="Фильтры курсов" className="rounded-brand border-2 border-line bg-paper p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative md:col-span-2"><span className="sr-only">Поиск по названию или коду</span><Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" size={18} /><input className="h-12 w-full rounded-brand border-2 border-line bg-paper pl-10 pr-3 text-sm font-bold outline-none focus:border-macaw" onChange={(event) => updateSearch({ q: event.target.value || undefined })} placeholder="Название или код курса" value={search} /></label>
          <FilterSelect label="Статус" onChange={(value) => updateSearch({ status: value || undefined })} value={status ?? ""}><option value="">Все статусы</option>{(Object.entries(apiCourseStatusLabels) as Array<[CourseStatus, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FilterSelect>
          <FilterSelect label="Язык" onChange={(value) => updateSearch({ language: value || undefined })} value={language ?? ""}><option value="">Все языки</option>{(Object.entries(languageLabels) as Array<[CourseLanguage, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FilterSelect>
          <FilterSelect label="Факультет" onChange={(value) => updateSearch({ faculty: value || undefined, department: undefined, program: undefined })} value={selectValue(faculty)}><option value="">Все факультеты</option>{(facultiesQuery.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</FilterSelect>
          <FilterSelect disabled={!faculty} label="Кафедра" onChange={(value) => updateSearch({ department: value || undefined, program: undefined })} value={selectValue(department)}><option value="">Все кафедры</option>{(departmentsQuery.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</FilterSelect>
          <FilterSelect disabled={!department} label="Программа" onChange={(value) => updateSearch({ program: value || undefined })} value={selectValue(program)}><option value="">Все программы</option>{(programsQuery.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</FilterSelect>
          <FilterSelect label="Семестр" onChange={(value) => updateSearch({ semester: value || undefined })} value={selectValue(semester)}><option value="">Все семестры</option>{(semestersQuery.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</FilterSelect>
          {canLoadTeachers ? <FilterSelect label="Преподаватель" onChange={(value) => updateSearch({ teacher: value || undefined })} value={selectValue(teacher)}><option value="">Все преподаватели</option>{(teachersQuery.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.full_name || item.email || `User #${item.id}`}</option>)}</FilterSelect> : null}
          <FilterSelect label="Сортировка" onChange={(value) => updateSearch({ ordering: value === "-updated_at" ? undefined : value })} value={ordering}>{orderingOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FilterSelect>
        </div>
        <div className="mt-3 flex justify-end border-t-2 border-line pt-3"><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-brand border-2 border-line px-4 text-xs font-black text-ash hover:border-lingot hover:text-graphite" onClick={resetFilters} type="button"><FilterX aria-hidden="true" size={16} /> Сбросить</button></div>
      </section>

      {coursesQuery.isPending ? <StatePanel description="Получаем доступные вам курсы с сервера." kind="loading" title="Загрузка курсов" /> : coursesQuery.isError ? <StatePanel action={<button className="mt-2 text-sm font-black text-macaw-dark hover:underline" onClick={() => coursesQuery.refetch()} type="button">Повторить запрос</button>} description={coursesQuery.error.message} kind="error" title="Не удалось загрузить курсы" /> : coursesQuery.data.results.length === 0 ? <StatePanel action={<button className="mt-2 text-sm font-black text-macaw-dark hover:underline" onClick={resetFilters} type="button">Сбросить фильтры</button>} description="Измените параметры поиска или сбросьте фильтры." title="Курсы не найдены" /> : (
        <section className="overflow-hidden rounded-brand border-2 border-line bg-paper">
          <div className="flex items-center justify-between gap-4 border-b-2 border-line px-4 py-3"><span className="text-sm font-black text-graphite">Найдено: {coursesQuery.data.count}</span><label className="flex items-center gap-2 text-xs font-bold text-ash">На странице <select aria-label="Количество курсов на странице" className="rounded-brand border-2 border-line bg-paper px-2 py-1.5 font-black text-graphite" onChange={(event) => updateSearch({ page_size: event.target.value === "10" ? undefined : event.target.value })} value={pageSize}>{[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}</select></label></div>
          <div className="hidden overflow-x-auto xl:block"><table className="w-full min-w-[1050px] border-collapse text-left"><thead className="bg-mist text-[10px] font-black uppercase tracking-wider text-ash"><tr><th className="px-4 py-3">Курс</th><th className="px-4 py-3">Факультет</th><th className="px-4 py-3">Семестр</th><th className="px-4 py-3">Преподаватель</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Обновлён</th><th className="px-4 py-3"><span className="sr-only">Действия</span></th></tr></thead><tbody>{coursesQuery.data.results.map((course) => <tr className="border-t-2 border-line text-sm" key={course.id}><td className="px-4 py-4"><strong className="block font-black text-graphite">{course.title}</strong><span className="mt-1 block text-xs font-bold text-macaw-dark">{course.code} · {course.credits} кр.</span></td><td className="max-w-64 px-4 py-4 text-xs font-bold text-ash">{course.faculty.name}</td><td className="px-4 py-4 text-xs font-bold text-ash">{course.semester.name}</td><td className="px-4 py-4 text-xs font-bold text-ash">{course.teacher?.full_name ?? "Не назначен"}</td><td className="px-4 py-4"><ApiCourseStatusBadge status={course.status} /></td><td className="px-4 py-4 text-xs font-bold text-ash">{dateFormatter.format(new Date(course.updated_at))}</td><td className="px-4 py-4"><Link aria-label={`Открыть курс ${course.title}`} className="ml-auto grid size-10 place-items-center rounded-brand border-2 border-line text-graphite hover:border-macaw hover:text-macaw-dark" to={`/courses/${course.id}`}><Eye aria-hidden="true" size={17} /></Link></td></tr>)}</tbody></table></div>
          <div className="grid gap-3 p-3 xl:hidden">{coursesQuery.data.results.map((course) => <article className="rounded-brand border-2 border-line p-4" key={course.id}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="text-[10px] font-black uppercase tracking-wider text-macaw-dark">{course.code}</span><h2 className="mt-1 text-base font-black text-graphite">{course.title}</h2></div><ApiCourseStatusBadge status={course.status} /></div><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="font-bold text-ash">Преподаватель</dt><dd className="mt-1 font-black text-graphite">{course.teacher?.full_name ?? "Не назначен"}</dd></div><div><dt className="font-bold text-ash">Семестр</dt><dd className="mt-1 font-black text-graphite">{course.semester.name}</dd></div></dl><Link className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-brand border-2 border-line text-xs font-black text-graphite hover:border-macaw" to={`/courses/${course.id}`}><Eye aria-hidden="true" size={16} /> Открыть</Link></article>)}</div>
          <div className="flex items-center justify-between gap-4 border-t-2 border-line px-4 py-3"><span className="text-xs font-bold text-ash">Страница {page} из {pageCount}</span><div className="flex gap-2"><button aria-label="Предыдущая страница" className="grid size-10 place-items-center rounded-brand border-2 border-line text-graphite disabled:opacity-40" disabled={!coursesQuery.data.previous || coursesQuery.isFetching} onClick={() => updateSearch({ page: page > 2 ? String(page - 1) : undefined }, false)} type="button"><ChevronLeft aria-hidden="true" size={18} /></button><button aria-label="Следующая страница" className="grid size-10 place-items-center rounded-brand border-2 border-line text-graphite disabled:opacity-40" disabled={!coursesQuery.data.next || coursesQuery.isFetching} onClick={() => updateSearch({ page: String(page + 1) }, false)} type="button"><ChevronRight aria-hidden="true" size={18} /></button></div></div>
        </section>
      )}
    </div>
  );
}

interface FilterSelectProps { children: ReactNode; disabled?: boolean; label: string; onChange: (value: string) => void; value: string; }

function FilterSelect({ children, disabled = false, label, onChange, value }: FilterSelectProps) {
  return <label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-ash"><span>{label}</span><select className="h-12 rounded-brand border-2 border-line bg-paper px-3 text-sm font-bold normal-case tracking-normal text-graphite outline-none focus:border-macaw disabled:cursor-not-allowed disabled:bg-mist disabled:opacity-60" disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value}>{children}</select></label>;
}
