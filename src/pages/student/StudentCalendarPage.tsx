import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  ExternalLink,
  Filter,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeading from "../../components/student/PageHeading";
import StatePanel from "../../components/student/StatePanel";
import {
  getCourseById,
  mockCalendarEvents,
  mockCourses,
} from "../../services/studentCatalog";
import type {
  CalendarEvent,
  CalendarEventType,
} from "../../types/student";

type EventTypeFilter = "all" | CalendarEventType;

const typeLabels: Record<CalendarEventType, string> = {
  "course-start": "Начало курса",
  "course-end": "Окончание курса",
  "module-open": "Открытие модуля",
  "lesson-open": "Открытие урока",
  "lesson-close": "Закрытие урока",
};

const eventTypeOptions: Array<{
  label: string;
  value: EventTypeFilter;
}> = [
  { label: "Все типы", value: "all" },
  ...Object.entries(typeLabels).map(([value, label]) => ({
    label,
    value: value as CalendarEventType,
  })),
];

const monthFormatter = new Intl.DateTimeFormat("ru-RU", {
  month: "long",
  year: "numeric",
});
const fullDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const shortDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthDays(month: Date): Date[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function eventTarget(event: CalendarEvent): string {
  return event.lessonId
    ? `/student/courses/${event.courseId}/lessons/${event.lessonId}`
    : `/student/courses/${event.courseId}`;
}

export default function StudentCalendarPage() {
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(2026, 6, 1),
  );
  const [courseFilter, setCourseFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<EventTypeFilter>("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    mockCalendarEvents[0]?.id ?? null,
  );

  const filteredEvents = useMemo(
    () =>
      [...mockCalendarEvents]
        .filter(
          (event) =>
            (courseFilter === "all" || event.courseId === courseFilter) &&
            (typeFilter === "all" || event.type === typeFilter),
        )
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        ),
    [courseFilter, typeFilter],
  );
  const monthDays = useMemo(
    () => getMonthDays(visibleMonth),
    [visibleMonth],
  );
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((event) => {
      const key = dateKey(new Date(event.startsAt));
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, event]);
    });
    return map;
  }, [filteredEvents]);
  const selectedEvent =
    filteredEvents.find((event) => event.id === selectedEventId) ??
    filteredEvents[0] ??
    null;

  const changeMonth = (offset: number) => {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  };

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7">
      <PageHeading
        description="Учебные события, даты открытия модулей и сроки доступа к материалам."
        eyebrow="Расписание"
        title="Календарь"
      />

      <section className="grid gap-4 rounded-brand border-2 border-line bg-mist p-4 lg:grid-cols-[auto_minmax(190px,1fr)_minmax(190px,1fr)] lg:items-center">
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-ash">
          <Filter aria-hidden="true" size={17} />
          Фильтры
        </span>
        <label>
          <span className="sr-only">Курс</span>
          <select
            className="h-12 w-full rounded-brand border-2 border-line bg-paper px-3 text-sm font-extrabold text-graphite focus:border-macaw focus:outline-none"
            onChange={(event) => setCourseFilter(event.target.value)}
            value={courseFilter}
          >
            <option value="all">Все курсы</option>
            {mockCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Тип события</span>
          <select
            className="h-12 w-full rounded-brand border-2 border-line bg-paper px-3 text-sm font-extrabold text-graphite focus:border-macaw focus:outline-none"
            onChange={(event) =>
              setTypeFilter(event.target.value as EventTypeFilter)
            }
            value={typeFilter}
          >
            {eventTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="overflow-hidden rounded-brand border-2 border-line bg-paper">
          <header className="flex items-center justify-between gap-4 border-b-2 border-line p-4">
            <button
              aria-label="Предыдущий месяц"
              className="grid size-10 place-items-center rounded-brand border-2 border-line text-ash hover:bg-mist"
              onClick={() => changeMonth(-1)}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={18} />
            </button>
            <h2 className="text-center text-lg font-black capitalize text-navy">
              {monthFormatter.format(visibleMonth)}
            </h2>
            <button
              aria-label="Следующий месяц"
              className="grid size-10 place-items-center rounded-brand border-2 border-line text-ash hover:bg-mist"
              onClick={() => changeMonth(1)}
              type="button"
            >
              <ArrowRight aria-hidden="true" size={18} />
            </button>
          </header>

          <div className="grid grid-cols-7 border-b-2 border-line bg-mist">
            {weekDays.map((day) => (
              <span
                className="p-2 text-center text-[10px] font-black uppercase tracking-wider text-ash sm:p-3 sm:text-xs"
                key={day}
              >
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {monthDays.map((day) => {
              const key = dateKey(day);
              const events = eventsByDate.get(key) ?? [];
              const inCurrentMonth =
                day.getMonth() === visibleMonth.getMonth();

              return (
                <div
                  className={`min-h-20 border-b border-r border-line p-1.5 sm:min-h-28 sm:p-2 ${inCurrentMonth ? "bg-paper" : "bg-mist text-ash"}`}
                  key={key}
                >
                  <span className="block text-right text-[11px] font-black sm:text-xs">
                    {day.getDate()}
                  </span>
                  <div className="mt-1 grid gap-1">
                    {events.slice(0, 2).map((event) => (
                      <button
                        aria-label={`${event.title}, ${fullDateFormatter.format(new Date(event.startsAt))}`}
                        className="min-h-2 overflow-hidden rounded-brand border border-ecto bg-ecto/10 px-1 py-0.5 text-left text-[8px] font-black leading-3 text-ecto-dark sm:min-h-6 sm:text-[9px]"
                        key={event.id}
                        onClick={() => setSelectedEventId(event.id)}
                        title={event.title}
                        type="button"
                      >
                        <span className="hidden truncate sm:block">
                          {event.title}
                        </span>
                      </button>
                    ))}
                    {events.length > 2 && (
                      <span className="text-[8px] font-black text-ash">
                        +{events.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedEvent ? (
          <aside className="h-fit rounded-brand border-2 border-macaw bg-macaw/5 p-5 xl:sticky xl:top-28">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-macaw-dark">
              {typeLabels[selectedEvent.type]}
            </span>
            <h2 className="mt-2 text-xl font-black text-navy">
              {selectedEvent.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ash">
              {selectedEvent.description}
            </p>
            <dl className="mt-5 grid gap-3 text-xs">
              <div className="flex items-start gap-2">
                <Clock3
                  aria-hidden="true"
                  className="mt-0.5 text-macaw-dark"
                  size={16}
                />
                <div>
                  <dt className="font-black text-ash">Дата и время</dt>
                  <dd className="mt-0.5 font-bold text-graphite">
                    {fullDateFormatter.format(
                      new Date(selectedEvent.startsAt),
                    )}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarDays
                  aria-hidden="true"
                  className="mt-0.5 text-macaw-dark"
                  size={16}
                />
                <div>
                  <dt className="font-black text-ash">Курс</dt>
                  <dd className="mt-0.5 font-bold text-graphite">
                    {getCourseById(selectedEvent.courseId)?.title ??
                      "Неизвестный курс"}
                  </dd>
                </div>
              </div>
            </dl>
            <Link
              className="student-pressable mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-2.5 text-sm font-black text-white"
              to={eventTarget(selectedEvent)}
            >
              Перейти
              <ExternalLink aria-hidden="true" size={16} />
            </Link>
          </aside>
        ) : (
          <StatePanel
            description="Измените фильтры, чтобы увидеть учебные события."
            title="Событий нет"
          />
        )}
      </section>

      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
        <h2 className="text-2xl font-black text-navy">Ближайшие события</h2>
        {filteredEvents.length ? (
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
            {filteredEvents.map((event) => (
              <button
                className="flex min-w-0 w-full items-center gap-4 rounded-brand border-2 border-line bg-paper p-4 text-left hover:border-lingot hover:bg-ecto/5"
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                type="button"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 px-1 text-center text-[10px] font-black leading-4 text-macaw-dark">
                  {shortDateFormatter.format(new Date(event.startsAt))}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-black text-navy">
                    {event.title}
                  </strong>
                  <span className="mt-1 block truncate text-xs font-bold text-ash">
                    {getCourseById(event.courseId)?.title} ·{" "}
                    {typeLabels[event.type]}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="shrink-0 text-ash"
                  size={18}
                />
              </button>
            ))}
          </div>
        ) : (
          <StatePanel
            description="По выбранным курсам и типам событий ничего не найдено."
            title="Нет ближайших событий"
          />
        )}
      </section>
    </div>
  );
}
