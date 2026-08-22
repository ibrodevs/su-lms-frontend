import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { studentApi } from "../../api/student.api";
import type { StudentCourseDto, StudentCourseListParams, StudentCourseProgressDto } from "../../api/student.api";
import { studentKeys } from "../../api/studentKeys";
import ApiStudentCourseCard from "../../components/student/ApiStudentCourseCard";
import PageHeading from "../../components/student/PageHeading";
import { resolveStudentCourseStatus } from "../../components/student/resolveStudentCourseStatus";
import StatePanel from "../../components/student/StatePanel";
import type { CourseStatus } from "../../types/student";

type StatusFilter = "all" | Exclude<CourseStatus, "locked">;
type SortMode = "title" | "progress-desc" | "progress-asc";

const listParams: StudentCourseListParams = { pageSize: 100 };
const emptyCourses: StudentCourseDto[] = [];
const emptyProgress: StudentCourseProgressDto[] = [];
const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: "Все", value: "all" },
  { label: "Не начаты", value: "not-started" },
  { label: "В процессе", value: "in-progress" },
  { label: "Завершённые", value: "completed" },
];

export default function StudentCoursesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [semester, setSemester] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("title");
  const coursesQuery = useQuery({ queryKey: studentKeys.courses(listParams), queryFn: () => studentApi.courses(listParams) });
  const progressQuery = useQuery({ queryKey: studentKeys.progress(), queryFn: studentApi.progress });
  const courses = coursesQuery.data?.results ?? emptyCourses;
  const courseProgress = progressQuery.data?.courses ?? emptyProgress;
  const progressByCourse = useMemo(() => new Map(courseProgress.map((item) => [item.course_id, item])), [courseProgress]);
  const semesters = useMemo(() => Array.from(new Set(courses.map((course) => course.semester.name))), [courses]);
  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
    return courses.filter((course) => {
      const progress = progressByCourse.get(course.id);
      const matchesQuery = !normalizedQuery || [course.title, course.code, course.teacher?.full_name ?? ""].some((value) => value.toLocaleLowerCase("ru-RU").includes(normalizedQuery));
      const matchesStatus = status === "all" || resolveStudentCourseStatus(progress) === status;
      const matchesSemester = semester === "all" || course.semester.name === semester;
      return matchesQuery && matchesStatus && matchesSemester;
    }).sort((left, right) => {
      if (sortMode === "title") return left.title.localeCompare(right.title, "ru");
      const leftProgress = progressByCourse.get(left.id)?.progress_percent ?? 0;
      const rightProgress = progressByCourse.get(right.id)?.progress_percent ?? 0;
      return sortMode === "progress-desc" ? rightProgress - leftProgress : leftProgress - rightProgress;
    });
  }, [courses, progressByCourse, query, semester, sortMode, status]);

  const resetFilters = () => { setQuery(""); setStatus("all"); setSemester("all"); setSortMode("title"); };
  if (coursesQuery.isPending || progressQuery.isPending) return <StatePanel description="Получаем назначенные курсы и прогресс с backend." kind="loading" title="Загрузка курсов" />;
  if (coursesQuery.isError || progressQuery.isError) return <StatePanel description={(coursesQuery.error ?? progressQuery.error)?.message ?? "Не удалось получить данные."} kind="error" title="Курсы недоступны" />;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7">
      <PageHeading description="Только опубликованные курсы с активным enrollment, возвращённые backend." eyebrow="Обучение" title={`Мои курсы · ${coursesQuery.data.count}`} />
      {courses.length ? <>
        <section className="grid gap-4 rounded-brand border-2 border-line bg-mist p-4 lg:grid-cols-[minmax(260px,1fr)_auto_auto_auto]">
          <label className="relative block"><span className="sr-only">Поиск курсов</span><Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ash" size={19} /><input className="h-12 w-full rounded-brand border-2 border-line bg-paper pl-11 pr-4 text-sm font-bold text-graphite placeholder:text-ash focus:border-macaw focus:outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Название, код или преподаватель" type="search" value={query} /></label>
          <label className="grid gap-1"><span className="sr-only">Сортировка курсов</span><select className="h-12 min-w-44 rounded-brand border-2 border-line bg-paper px-3 text-sm font-extrabold text-graphite focus:border-macaw focus:outline-none" onChange={(event) => setSortMode(event.target.value as SortMode)} value={sortMode}><option value="title">По названию</option><option value="progress-desc">Прогресс: сначала высокий</option><option value="progress-asc">Прогресс: сначала низкий</option></select></label>
          <label className="grid gap-1"><span className="sr-only">Фильтр по семестру</span><select className="h-12 min-w-48 rounded-brand border-2 border-line bg-paper px-3 text-sm font-extrabold text-graphite focus:border-macaw focus:outline-none" onChange={(event) => setSemester(event.target.value)} value={semester}><option value="all">Все семестры</option>{semesters.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <div className="flex items-center gap-2 text-xs font-black text-ash"><SlidersHorizontal aria-hidden="true" size={17} /> Найдено: {filteredCourses.length}</div>
        </section>
        <div aria-label="Фильтр по статусу" className="flex max-w-full gap-2 overflow-x-auto pb-1" role="group">{statusOptions.map((option) => <button aria-pressed={status === option.value} className={status === option.value ? "shrink-0 rounded-brand border-2 border-ecto bg-ecto/10 px-4 py-2 text-xs font-black text-ecto-dark" : "shrink-0 rounded-brand border-2 border-line bg-paper px-4 py-2 text-xs font-black text-ash hover:bg-mist"} key={option.value} onClick={() => setStatus(option.value)} type="button">{option.label}</button>)}</div>
        {filteredCourses.length ? <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredCourses.map((course) => <ApiStudentCourseCard course={course} key={course.id} progress={progressByCourse.get(course.id)} />)}</section> : <StatePanel action={<button className="student-pressable mt-2 inline-flex items-center gap-2 rounded-brand border-2 border-lingot bg-paper px-4 py-2.5 text-sm font-black text-ecto-dark" onClick={resetFilters} type="button"><X aria-hidden="true" size={16} /> Сбросить фильтры</button>} description="Измените поисковый запрос, статус или семестр." title="Курсы не найдены" />}
      </> : <StatePanel description="Backend не вернул опубликованные курсы с активным зачислением." title="Назначенных курсов пока нет" />}
    </div>
  );
}
