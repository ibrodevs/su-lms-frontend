import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  FilterX,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import CourseStatusBadge from "../../components/staff/CourseStatusBadge";
import {
  mockDepartments,
  mockFaculties,
  mockPrograms,
  mockSemesters,
} from "../../data/mock/mockOrganization";
import { mockStaffUsers, mockTeachers } from "../../data/mock/mockUsers";
import { useMockLoading } from "../../hooks/useMockLoading";
import {
  filterCourses,
  getVisibleCourses,
  subscribeCourseStore,
} from "../../services/courseService";
import { getStaffSession } from "../../services/staffSession";
import type { CourseFilters, CourseLanguage, CourseSortField, CourseStatus } from "../../types/staff";
import { courseLanguageLabels, courseStatusLabels } from "../../utils/staffDisplay";

const defaultFilters: CourseFilters = {
  query: "",
  status: "all",
  semesterId: "",
  facultyId: "",
  departmentId: "",
  programId: "",
  teacherId: "",
  language: "all",
  sortBy: "updatedAt",
  sortDirection: "desc",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default function StaffCoursesPage() {
  const session = getStaffSession();
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [filters, setFilters] = useState<CourseFilters>(() => ({
    ...defaultFilters,
    query: queryParams.get("q") ?? "",
    status: (queryParams.get("status") as CourseStatus | null) ?? "all",
  }));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [revision, setRevision] = useState(0);
  const isLoading = useMockLoading();

  useEffect(() => subscribeCourseStore(() => setRevision((value) => value + 1)), []);
  useEffect(() => {
    setFilters((current) => ({
      ...current,
      query: queryParams.get("q") ?? current.query,
      status: (queryParams.get("status") as CourseStatus | null) ?? current.status,
    }));
    setPage(1);
  }, [queryParams]);

  const sessionRole = session?.role;
  const sessionUserId = session?.userId;
  const courses = useMemo(() => {
    void revision;
    return sessionRole && sessionUserId
      ? getVisibleCourses(sessionRole, sessionUserId)
      : [];
  }, [revision, sessionRole, sessionUserId]);
  const filteredCourses = useMemo(() => filterCourses(courses, filters), [courses, filters]);
  const pageCount = Math.max(1, Math.ceil(filteredCourses.length / pageSize));
  const visibleCourses = filteredCourses.slice((page - 1) * pageSize, page * pageSize);
  const availableDepartments = mockDepartments.filter(
    (department) => !filters.facultyId || department.facultyId === filters.facultyId,
  );
  const availablePrograms = mockPrograms.filter(
    (program) => !filters.departmentId || program.departmentId === filters.departmentId,
  );

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const updateFilter = <Key extends keyof CourseFilters>(
    key: Key,
    value: CourseFilters[Key],
  ) => {
    setFilters((current) => {
      const next = { ...current, [key]: value };
      if (key === "facultyId") {
        next.departmentId = "";
        next.programId = "";
      }
      if (key === "departmentId") next.programId = "";
      return next;
    });
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const renderCourseMeta = (courseId: string, field: "teacher" | "semester" | "faculty") => {
    const course = courses.find((item) => item.id === courseId);
    if (!course) return "—";
    if (field === "teacher") {
      const teacher = mockStaffUsers.find((user) => user.id === course.teacherId);
      return teacher ? `${teacher.firstName} ${teacher.lastName}` : "—";
    }
    if (field === "semester") {
      return mockSemesters.find((semester) => semester.id === course.semesterId)?.name ?? "—";
    }
    return mockFaculties.find((faculty) => faculty.id === course.facultyId)?.name ?? "—";
  };

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Course Management</span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">Курсы</h1>
          <p className="mt-2 text-sm text-ash">
            {session?.role === "teacher"
              ? "Управление назначенными учебными курсами"
              : "Управление учебными курсами SU LMS"}
          </p>
        </div>
        <Link
          className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white"
          to="/courses/create"
        >
          <Plus aria-hidden="true" size={19} />
          Создать курс
        </Link>
      </header>

      <section aria-label="Фильтры курсов" className="rounded-brand border-2 border-line bg-paper p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2">
            <span className="sr-only">Поиск по названию или коду</span>
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" size={18} />
            <input
              className="h-12 w-full rounded-brand border-2 border-line bg-paper pl-10 pr-3 text-sm font-bold outline-none focus:border-macaw"
              onChange={(event) => updateFilter("query", event.target.value)}
              placeholder="Название или код курса"
              value={filters.query}
            />
          </label>
          <FilterSelect
            label="Статус"
            onChange={(value) => updateFilter("status", value as CourseStatus | "all")}
            value={filters.status}
          >
            <option value="all">Все статусы</option>
            {(Object.entries(courseStatusLabels) as Array<[CourseStatus, string]>).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Семестр"
            onChange={(value) => updateFilter("semesterId", value)}
            value={filters.semesterId}
          >
            <option value="">Все семестры</option>
            {mockSemesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
          </FilterSelect>
          <FilterSelect
            label="Факультет"
            onChange={(value) => updateFilter("facultyId", value)}
            value={filters.facultyId}
          >
            <option value="">Все факультеты</option>
            {mockFaculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
          </FilterSelect>
          <FilterSelect
            label="Кафедра"
            onChange={(value) => updateFilter("departmentId", value)}
            value={filters.departmentId}
          >
            <option value="">Все кафедры</option>
            {availableDepartments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </FilterSelect>
          <FilterSelect
            label="Программа"
            onChange={(value) => updateFilter("programId", value)}
            value={filters.programId}
          >
            <option value="">Все программы</option>
            {availablePrograms.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
          </FilterSelect>
          <FilterSelect
            label="Преподаватель"
            onChange={(value) => updateFilter("teacherId", value)}
            value={filters.teacherId}
          >
            <option value="">Все преподаватели</option>
            {mockTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.firstName} {teacher.lastName}</option>)}
          </FilterSelect>
          <FilterSelect
            label="Язык"
            onChange={(value) => updateFilter("language", value as CourseLanguage | "all")}
            value={filters.language}
          >
            <option value="all">Все языки</option>
            {(Object.entries(courseLanguageLabels) as Array<[CourseLanguage, string]>).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Сортировка"
            onChange={(value) => updateFilter("sortBy", value as CourseSortField)}
            value={filters.sortBy}
          >
            <option value="updatedAt">Дата изменения</option>
            <option value="createdAt">Дата создания</option>
            <option value="title">Название</option>
            <option value="code">Code</option>
            <option value="startDate">Дата начала</option>
            <option value="status">Статус</option>
          </FilterSelect>
          <FilterSelect
            label="Направление"
            onChange={(value) => updateFilter("sortDirection", value as "asc" | "desc")}
            value={filters.sortDirection}
          >
            <option value="desc">По убыванию</option>
            <option value="asc">По возрастанию</option>
          </FilterSelect>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-line px-4 text-sm font-black text-ash hover:border-lingot hover:bg-eel/10 hover:text-graphite"
            onClick={resetFilters}
            type="button"
          >
            <FilterX aria-hidden="true" size={18} />
            Сбросить фильтры
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-brand border-2 border-line bg-paper">
        <div className="flex items-center justify-between gap-4 border-b-2 border-line px-4 py-3">
          <span className="text-sm font-black text-graphite">Найдено: {filteredCourses.length}</span>
          <label className="flex items-center gap-2 text-xs font-bold text-ash">
            На странице
            <select
              aria-label="Количество курсов на странице"
              className="rounded-brand border-2 border-line bg-paper px-2 py-1.5 font-black text-graphite"
              onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
              value={pageSize}
            >
              {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
        </div>

        {isLoading ? (
          <div aria-label="Загрузка курсов" className="grid gap-3 p-4">
            {[1, 2, 3, 4].map((item) => <div className="h-16 animate-pulse rounded-brand bg-mist" key={item} />)}
          </div>
        ) : visibleCourses.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1050px] border-collapse text-left">
                <thead className="bg-mist text-[10px] font-black uppercase tracking-wider text-ash">
                  <tr>
                    <th className="px-4 py-3">Курс</th>
                    <th className="px-4 py-3">Факультет</th>
                    <th className="px-4 py-3">Семестр</th>
                    <th className="px-4 py-3">Преподаватель</th>
                    <th className="px-4 py-3">Статус</th>
                    <th className="px-4 py-3">Обновлён</th>
                    <th className="px-4 py-3"><span className="sr-only">Действия</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCourses.map((course) => (
                    <tr className="border-t-2 border-line text-sm" key={course.id}>
                      <td className="px-4 py-4">
                        <strong className="block font-black text-graphite">{course.title}</strong>
                        <span className="mt-1 block text-xs font-bold text-macaw-dark">{course.code} · {course.credits} кр.</span>
                      </td>
                      <td className="max-w-56 px-4 py-4 text-xs font-bold text-ash">{renderCourseMeta(course.id, "faculty")}</td>
                      <td className="px-4 py-4 text-xs font-bold text-ash">{renderCourseMeta(course.id, "semester")}</td>
                      <td className="px-4 py-4 text-xs font-bold text-ash">{renderCourseMeta(course.id, "teacher")}</td>
                      <td className="px-4 py-4"><CourseStatusBadge status={course.status} /></td>
                      <td className="px-4 py-4 text-xs font-bold text-ash">{dateFormatter.format(new Date(course.updatedAt))}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionLink label="Открыть" to={`/courses/${course.id}`}><Eye aria-hidden="true" size={16} /></ActionLink>
                          <ActionLink label="Редактировать" to={`/courses/${course.id}/edit`}><Edit3 aria-hidden="true" size={16} /></ActionLink>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 lg:hidden">
              {visibleCourses.map((course) => (
                <article className="rounded-brand border-2 border-line p-4" key={course.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-wider text-macaw-dark">{course.code}</span>
                      <h2 className="mt-1 text-base font-black text-graphite">{course.title}</h2>
                    </div>
                    <CourseStatusBadge status={course.status} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div><dt className="font-bold text-ash">Преподаватель</dt><dd className="mt-1 font-black text-graphite">{renderCourseMeta(course.id, "teacher")}</dd></div>
                    <div><dt className="font-bold text-ash">Семестр</dt><dd className="mt-1 font-black text-graphite">{renderCourseMeta(course.id, "semester")}</dd></div>
                  </dl>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <ActionLink label="Открыть" to={`/courses/${course.id}`}><Eye aria-hidden="true" size={16} /></ActionLink>
                    <ActionLink label="Изменить" to={`/courses/${course.id}/edit`}><Edit3 aria-hidden="true" size={16} /></ActionLink>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="grid min-h-72 place-items-center p-6 text-center">
            <div>
              <MoreHorizontal aria-hidden="true" className="mx-auto text-ash" size={36} />
              <h2 className="mt-3 text-xl font-black text-navy">Курсы не найдены</h2>
              <p className="mt-2 text-sm text-ash">Измените параметры поиска или сбросьте фильтры.</p>
              <button className="mt-4 text-sm font-black text-macaw-dark hover:underline" onClick={resetFilters} type="button">Сбросить фильтры</button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 border-t-2 border-line px-4 py-3">
          <span className="text-xs font-bold text-ash">Страница {page} из {pageCount}</span>
          <div className="flex gap-2">
            <button aria-label="Предыдущая страница" className="grid size-10 place-items-center rounded-brand border-2 border-line text-graphite disabled:opacity-40" disabled={page === 1} onClick={() => setPage((current) => current - 1)} type="button"><ChevronLeft aria-hidden="true" size={18} /></button>
            <button aria-label="Следующая страница" className="grid size-10 place-items-center rounded-brand border-2 border-line text-graphite disabled:opacity-40" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)} type="button"><ChevronRight aria-hidden="true" size={18} /></button>
          </div>
        </div>
      </section>
    </div>
  );
}

interface FilterSelectProps {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}

function FilterSelect({ children, label, onChange, value }: FilterSelectProps) {
  return (
    <label className="grid gap-1 text-[11px] font-black uppercase tracking-wider text-ash">
      {label}
      <select
        className="h-12 min-w-0 rounded-brand border-2 border-line bg-paper px-3 text-sm font-bold normal-case tracking-normal text-graphite outline-none focus:border-macaw"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

interface ActionLinkProps {
  children: React.ReactNode;
  label: string;
  to: string;
}

function ActionLink({ children, label, to }: ActionLinkProps) {
  return (
    <Link
      aria-label={label}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-brand border-2 border-line px-3 text-xs font-black text-graphite hover:border-lingot hover:bg-eel/10"
      to={to}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
