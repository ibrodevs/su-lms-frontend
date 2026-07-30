import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import CourseCard from "../../components/student/CourseCard";
import PageHeading from "../../components/student/PageHeading";
import StatePanel from "../../components/student/StatePanel";
import { useStudentProgress } from "../../hooks/useStudentProgress";
import { mockCourses } from "../../services/studentCatalog";
import { getCourseProgress } from "../../services/studentProgress";
import type { CourseStatus } from "../../types/student";

type StatusFilter = "all" | CourseStatus;

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: "Все", value: "all" },
  { label: "Не начаты", value: "not-started" },
  { label: "В процессе", value: "in-progress" },
  { label: "Завершённые", value: "completed" },
];

export default function StudentCoursesPage() {
  const { state } = useStudentProgress();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [semester, setSemester] = useState("all");
  const semesters = Array.from(
    new Set(mockCourses.map((course) => course.semester)),
  );

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");

    return mockCourses.filter((course) => {
      const progress = getCourseProgress(course, state);
      const matchesQuery =
        !normalizedQuery ||
        [course.title, course.code, course.instructor.name].some((value) =>
          value.toLocaleLowerCase("ru-RU").includes(normalizedQuery),
        );
      const matchesStatus =
        status === "all" || progress.status === status;
      const matchesSemester =
        semester === "all" || course.semester === semester;

      return matchesQuery && matchesStatus && matchesSemester;
    });
  }, [query, semester, state, status]);

  const resetFilters = () => {
    setQuery("");
    setStatus("all");
    setSemester("all");
  };

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7">
      <PageHeading
        description="Все назначенные курсы, их статус и текущий учебный прогресс."
        eyebrow="Обучение"
        title={`Мои курсы · ${mockCourses.length}`}
      />

      <section className="grid gap-4 rounded-brand border-2 border-line bg-mist p-4 lg:grid-cols-[minmax(260px,1fr)_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Поиск курсов</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ash"
            size={19}
          />
          <input
            className="h-12 w-full rounded-brand border-2 border-line bg-paper pl-11 pr-4 text-sm font-bold text-graphite placeholder:text-ash focus:border-macaw focus:outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название, код или преподаватель"
            type="search"
            value={query}
          />
        </label>

        <label className="grid gap-1">
          <span className="sr-only">Фильтр по семестру</span>
          <select
            className="h-12 min-w-48 rounded-brand border-2 border-line bg-paper px-3 text-sm font-extrabold text-graphite focus:border-macaw focus:outline-none"
            onChange={(event) => setSemester(event.target.value)}
            value={semester}
          >
            <option value="all">Все семестры</option>
            {semesters.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2 text-xs font-black text-ash">
          <SlidersHorizontal aria-hidden="true" size={17} />
          Найдено: {filteredCourses.length}
        </div>
      </section>

      <div
        aria-label="Фильтр по статусу"
        className="flex max-w-full gap-2 overflow-x-auto pb-1"
      >
        {statusOptions.map((option) => (
          <button
            aria-pressed={status === option.value}
            className={
              status === option.value
                ? "shrink-0 rounded-brand border-2 border-ecto bg-ecto/10 px-4 py-2 text-xs font-black text-ecto-dark"
                : "shrink-0 rounded-brand border-2 border-line bg-paper px-4 py-2 text-xs font-black text-ash hover:bg-mist"
            }
            key={option.value}
            onClick={() => setStatus(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredCourses.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard
              course={course}
              key={course.id}
              progress={getCourseProgress(course, state)}
            />
          ))}
        </section>
      ) : (
        <StatePanel
          action={
            <button
              className="student-pressable mt-2 inline-flex items-center gap-2 rounded-brand border-2 border-lingot bg-paper px-4 py-2.5 text-sm font-black text-ecto-dark"
              onClick={resetFilters}
              type="button"
            >
              <X aria-hidden="true" size={16} />
              Сбросить фильтры
            </button>
          }
          description="Измените поисковый запрос, статус или семестр."
          title="Курсы не найдены"
        />
      )}
    </div>
  );
}
