import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, ExternalLink, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { calendarApi } from "../../api/calendar.api";
import type { CalendarEventType, StudentCalendarEventDto, StudentCalendarParams } from "../../api/calendar.api";
import { calendarKeys } from "../../api/calendarKeys";
import { studentApi } from "../../api/student.api";
import type { StudentCourseListParams } from "../../api/student.api";
import { studentKeys } from "../../api/studentKeys";
import PageHeading from "../../components/student/PageHeading";
import StatePanel from "../../components/student/StatePanel";

type EventTypeFilter = "all" | CalendarEventType;

const typeLabels: Record<CalendarEventType, string> = {
  course_start: "Начало курса",
  course_end: "Окончание курса",
  module_release: "Открытие модуля",
  lesson_release: "Открытие урока",
  custom: "Событие",
};
const eventTypeClasses: Record<CalendarEventType, string> = {
  course_start: "border-ecto bg-ecto/10 text-ecto-dark",
  course_end: "border-navy bg-navy/10 text-navy",
  module_release: "border-macaw bg-macaw/10 text-macaw-dark",
  lesson_release: "border-warning bg-warning/10 text-warning-dark",
  custom: "border-lingot bg-lingot/15 text-ecto-dark",
};
const eventTypeOptions: Array<{ label: string; value: EventTypeFilter }> = [
  { label: "Все типы", value: "all" },
  ...Object.entries(typeLabels).map(([value, label]) => ({ label, value: value as CalendarEventType })),
];
const listParams: StudentCourseListParams = { pageSize: 100 };
const monthFormatter = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });
const fullDateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
const shortDateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
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

export default function StudentCalendarPage() {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [courseFilter, setCourseFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<EventTypeFilter>("all");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const monthDays = useMemo(() => getMonthDays(visibleMonth), [visibleMonth]);
  const calendarParams = useMemo<StudentCalendarParams>(() => ({
    dateFrom: dateKey(monthDays[0] ?? visibleMonth),
    dateTo: dateKey(monthDays[monthDays.length - 1] ?? visibleMonth),
    course: courseFilter === "all" ? undefined : Number(courseFilter),
    eventType: typeFilter === "all" ? undefined : typeFilter,
    page,
    pageSize: 100,
  }), [courseFilter, monthDays, page, typeFilter, visibleMonth]);
  const calendarQuery = useQuery({ queryKey: calendarKeys.student(calendarParams), queryFn: () => calendarApi.student(calendarParams) });
  const coursesQuery = useQuery({ queryKey: studentKeys.courses(listParams), queryFn: () => studentApi.courses(listParams) });

  if (calendarQuery.isPending || coursesQuery.isPending) return <StatePanel description="Получаем события и доступные курсы с backend." kind="loading" title="Загрузка календаря" />;
  if (calendarQuery.isError || coursesQuery.isError) return <StatePanel description={(calendarQuery.error ?? coursesQuery.error)?.message ?? "Не удалось получить календарь."} kind="error" title="Календарь недоступен" />;

  const events = calendarQuery.data.results;
  const eventsByDate = new Map<string, StudentCalendarEventDto[]>();
  for (const event of events) {
    const key = dateKey(new Date(event.start_at));
    const current = eventsByDate.get(key);
    if (current) current.push(event);
    else eventsByDate.set(key, [event]);
  }
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0] ?? null;
  const todayKey = dateKey(new Date());

  const changeMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    setPage(1);
    setSelectedEventId(null);
  };

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7">
      <PageHeading description="Только публичные события активных опубликованных курсов, доступные текущему студенту." eyebrow="Расписание" title="Календарь" />

      <section className="grid gap-4 rounded-brand border-2 border-line bg-mist p-4 lg:grid-cols-[auto_minmax(190px,1fr)_minmax(190px,1fr)] lg:items-center">
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-ash"><Filter aria-hidden="true" size={17} />Фильтры</span>
        <label><span className="sr-only">Курс</span><select className="h-12 w-full rounded-brand border-2 border-line bg-paper px-3 text-sm font-extrabold text-graphite focus:border-macaw focus:outline-none" onChange={(event) => { setCourseFilter(event.target.value); setPage(1); setSelectedEventId(null); }} value={courseFilter}><option value="all">Все курсы</option>{coursesQuery.data.results.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
        <label><span className="sr-only">Тип события</span><select className="h-12 w-full rounded-brand border-2 border-line bg-paper px-3 text-sm font-extrabold text-graphite focus:border-macaw focus:outline-none" onChange={(event) => { setTypeFilter(event.target.value as EventTypeFilter); setPage(1); setSelectedEventId(null); }} value={typeFilter}>{eventTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="overflow-hidden rounded-brand border-2 border-line bg-paper">
          <header className="flex items-center justify-between gap-3 border-b-2 border-line p-4"><button aria-label="Предыдущий месяц" className="grid size-10 place-items-center rounded-brand border-2 border-line text-ash hover:bg-mist" onClick={() => changeMonth(-1)} type="button"><ArrowLeft aria-hidden="true" size={18} /></button><div className="grid justify-items-center gap-1"><h2 className="text-center text-lg font-black capitalize text-navy">{monthFormatter.format(visibleMonth)}</h2><button className="text-xs font-black text-macaw-dark hover:underline" onClick={() => { setVisibleMonth(new Date()); setPage(1); setSelectedEventId(null); }} type="button">Сегодня</button></div><button aria-label="Следующий месяц" className="grid size-10 place-items-center rounded-brand border-2 border-line text-ash hover:bg-mist" onClick={() => changeMonth(1)} type="button"><ArrowRight aria-hidden="true" size={18} /></button></header>
          <div className="grid grid-cols-7 border-b-2 border-line bg-mist">{weekDays.map((day) => <span className="p-2 text-center text-[10px] font-black uppercase tracking-wider text-ash sm:p-3 sm:text-xs" key={day}>{day}</span>)}</div>
          <div className="grid grid-cols-7">
            {monthDays.map((day) => {
              const key = dateKey(day);
              const dayEvents = eventsByDate.get(key) ?? [];
              const inCurrentMonth = day.getMonth() === visibleMonth.getMonth();
              return <div className={`min-h-20 border-b border-r border-line p-1.5 sm:min-h-28 sm:p-2 ${inCurrentMonth ? "bg-paper" : "bg-mist text-ash"} ${key === todayKey ? "ring-2 ring-inset ring-ecto" : ""}`} key={key}><span className="block text-right text-[11px] font-black sm:text-xs">{day.getDate()}</span><div className="mt-1 grid gap-1">{dayEvents.slice(0, 2).map((event) => <button aria-label={`${event.title}, ${fullDateFormatter.format(new Date(event.start_at))}`} className={`min-h-2 overflow-hidden rounded-brand border px-1 py-0.5 text-left text-[8px] font-black leading-3 sm:min-h-6 sm:text-[9px] ${eventTypeClasses[event.event_type]}`} key={event.id} onClick={() => setSelectedEventId(event.id)} title={event.title} type="button"><span className="hidden truncate sm:block">{event.title}</span></button>)}{dayEvents.length > 2 ? <span className="text-[8px] font-black text-ash">+{dayEvents.length - 2}</span> : null}</div></div>;
            })}
          </div>
          {calendarQuery.data.previous || calendarQuery.data.next ? <footer className="flex items-center justify-between gap-3 border-t-2 border-line p-4"><button className="rounded-brand border-2 border-line px-3 py-2 text-xs font-black text-ash disabled:opacity-40" disabled={!calendarQuery.data.previous} onClick={() => { setPage((current) => Math.max(1, current - 1)); setSelectedEventId(null); }} type="button">Предыдущая</button><span className="text-xs font-black text-ash">Страница {page}</span><button className="rounded-brand border-2 border-line px-3 py-2 text-xs font-black text-ash disabled:opacity-40" disabled={!calendarQuery.data.next} onClick={() => { setPage((current) => current + 1); setSelectedEventId(null); }} type="button">Следующая</button></footer> : null}
        </div>

        {selectedEvent ? <aside className="h-fit rounded-brand border-2 border-macaw bg-macaw/5 p-5 xl:sticky xl:top-28"><span className="text-[10px] font-black uppercase tracking-[0.14em] text-macaw-dark">{typeLabels[selectedEvent.event_type]}</span><h2 className="mt-2 text-xl font-black text-navy">{selectedEvent.title}</h2><p className="mt-3 text-sm leading-6 text-ash">{selectedEvent.description || "Описание события не добавлено."}</p><dl className="mt-5 grid gap-3 text-xs"><div className="flex items-start gap-2"><Clock3 aria-hidden="true" className="mt-0.5 text-macaw-dark" size={16} /><div><dt className="font-black text-ash">Начало</dt><dd className="mt-0.5 font-bold text-graphite">{fullDateFormatter.format(new Date(selectedEvent.start_at))}</dd></div></div>{selectedEvent.end_at ? <div className="flex items-start gap-2"><Clock3 aria-hidden="true" className="mt-0.5 text-macaw-dark" size={16} /><div><dt className="font-black text-ash">Окончание</dt><dd className="mt-0.5 font-bold text-graphite">{fullDateFormatter.format(new Date(selectedEvent.end_at))}</dd></div></div> : null}<div className="flex items-start gap-2"><CalendarDays aria-hidden="true" className="mt-0.5 text-macaw-dark" size={16} /><div><dt className="font-black text-ash">Курс</dt><dd className="mt-0.5 font-bold text-graphite">{selectedEvent.course_code} · {selectedEvent.course_title}</dd></div></div></dl><Link className="student-pressable mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-2.5 text-sm font-black text-white" to={`/student/courses/${selectedEvent.course_id}`}>Перейти к курсу<ExternalLink aria-hidden="true" size={16} /></Link></aside> : <StatePanel description="В выбранном периоде и с текущими фильтрами событий нет." title="Событий нет" />}
      </section>

      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4"><div className="flex flex-wrap items-end justify-between gap-3"><h2 className="text-2xl font-black text-navy">События выбранного периода</h2><span className="text-xs font-black text-ash">Найдено: {calendarQuery.data.count}</span></div>{events.length ? <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">{events.map((event) => <button aria-pressed={selectedEvent?.id === event.id} className="flex min-w-0 w-full items-center gap-4 rounded-brand border-2 border-line bg-paper p-4 text-left hover:border-lingot hover:bg-ecto/5" key={event.id} onClick={() => setSelectedEventId(event.id)} type="button"><span className="grid size-14 shrink-0 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 px-1 text-center text-[10px] font-black leading-4 text-macaw-dark">{shortDateFormatter.format(new Date(event.start_at))}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm font-black text-navy">{event.title}</strong><span className="mt-1 block truncate text-xs font-bold text-ash">{event.course_title} · {typeLabels[event.event_type]}</span></span><ArrowRight aria-hidden="true" className="shrink-0 text-ash" size={18} /></button>)}</div> : <StatePanel description="Измените месяц, курс или тип события." title="Нет событий в выбранном периоде" />}</section>
    </div>
  );
}
