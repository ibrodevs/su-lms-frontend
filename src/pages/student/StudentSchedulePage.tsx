import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";
import PageHeading from "../../components/student/PageHeading";
import StatePanel from "../../components/student/StatePanel";
import { mockCourses } from "../../data/student/mockCourses";
import { mockSchedule } from "../../data/student/mockSchedule";
import { useMockLoading } from "../../hooks/useMockLoading";

const typeLabels = { lecture: "Лекция", practice: "Практика", lab: "Лабораторная", online: "Онлайн", exam: "Экзамен" } as const;
const dayFormatter = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Almaty" });
const timeFormatter = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Almaty" });

function getWeekStart(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return date;
}

export default function StudentSchedulePage() {
  const isLoading = useMockLoading();
  const [weekOffset, setWeekOffset] = useState(0);
  const currentWeekStart = useMemo(() => getWeekStart(new Date()), []);
  const start = useMemo(() => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + weekOffset * 7);
    return date;
  }, [currentWeekStart, weekOffset]);
  const end = useMemo(() => {
    const date = new Date(start);
    date.setDate(date.getDate() + 7);
    return date;
  }, [start]);
  const items = useMemo(() => mockSchedule.filter((item) => { const date = new Date(item.startsAt); return date >= start && date < end; }), [end, start]);
  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => { const key = new Date(item.startsAt).toISOString().slice(0, 10); (acc[key] ??= []).push(item); return acc; }, {});
  if (isLoading) return <StatePanel kind="loading" title="Загружаем расписание" description="Собираем занятия на выбранную неделю." />;
  return <div className="grid gap-6"><PageHeading eyebrow="Учебный календарь" title="Расписание" description="Занятия на неделю с быстрым переходом к текущему дню." actions={<div className="flex gap-2"><button aria-label="Предыдущая неделя" className="grid size-11 place-items-center rounded-brand border-2 border-line" onClick={() => setWeekOffset((value) => value - 1)} type="button"><ChevronLeft size={18} /></button><button aria-label="Следующая неделя" className="grid size-11 place-items-center rounded-brand border-2 border-line" onClick={() => setWeekOffset((value) => value + 1)} type="button"><ChevronRight size={18} /></button></div>} /><div className="flex items-center gap-2 rounded-brand border-2 border-eel bg-ecto/10 px-4 py-3 text-sm font-black text-ecto-dark"><CalendarDays size={18} /> Неделя {weekOffset === 0 ? "текущая" : weekOffset > 0 ? `+${weekOffset}` : weekOffset}</div>{items.length === 0 ? <StatePanel title="На этой неделе занятий нет" description="Выберите другую неделю или проверьте календарь событий." /> : <section className="grid gap-4">{Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, dayItems]) => <div className="grid gap-3" key={date}><h2 className="text-lg font-black capitalize text-navy">{dayFormatter.format(new Date(`${date}T00:00:00+06:00`))}</h2>{dayItems.map((item) => { const course = mockCourses.find((entry) => entry.id === item.courseId); return <article className="grid gap-3 rounded-brand border-2 border-line bg-paper p-5 md:grid-cols-[auto_1fr_auto] md:items-center" key={item.id}><div className="grid size-14 place-items-center rounded-brand border-2 border-macaw/30 bg-macaw/10 text-macaw-dark"><Clock3 size={21} /></div><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black uppercase tracking-[0.1em] text-ecto-dark">{typeLabels[item.type]}</span><span className="text-xs font-bold text-ash">{course?.code}</span></div><h3 className="mt-1 text-lg font-black text-navy">{item.title}</h3><p className="mt-1 text-sm text-ash">{item.instructor} · {item.room} · {item.group}</p></div><strong className="text-sm font-black text-graphite">{timeFormatter.format(new Date(item.startsAt))}–{timeFormatter.format(new Date(item.endsAt))}</strong></article>; })}</div>)}</section>}</div>;
}
