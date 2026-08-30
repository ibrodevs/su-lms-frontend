import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { calendarApi } from "../../api/calendar.api";
import type {
  CalendarEventType,
  StaffCalendarEventDto,
  StaffCalendarEventPayload,
  StaffCalendarParams,
} from "../../api/calendar.api";
import { calendarKeys } from "../../api/calendarKeys";
import { courseKeys } from "../../api/courseKeys";
import { coursesApi } from "../../api/courses.api";
import type { CourseListParams } from "../../api/courses.api";
import { ApiClientError } from "../../api/errors";
import { useAuth } from "../../auth/useAuth";
import ConfirmDialog from "../../components/student/ConfirmDialog";
import StatePanel from "../../components/student/StatePanel";

type EventTypeFilter = "" | CalendarEventType;

interface CalendarFormState {
  course: string;
  title: string;
  description: string;
  eventType: CalendarEventType;
  startAt: string;
  endAt: string;
  isPublic: boolean;
}

const PAGE_SIZE = 20;
const courseParams: CourseListParams = { ordering: "title", pageSize: 100 };
const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
});
const eventTypeLabels: Record<CalendarEventType, string> = {
  course_start: "Начало курса",
  course_end: "Окончание курса",
  module_release: "Открытие модуля",
  lesson_release: "Открытие урока",
  custom: "Событие",
};
const emptyForm: CalendarFormState = {
  course: "",
  title: "",
  description: "",
  eventType: "custom",
  startAt: "",
  endAt: "",
  isPublic: true,
};

function toLocalDateTime(value: string): string {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function toPayload(form: CalendarFormState): StaffCalendarEventPayload {
  return {
    course: Number(form.course),
    title: form.title.trim(),
    description: form.description.trim(),
    event_type: form.eventType,
    start_at: new Date(form.startAt).toISOString(),
    end_at: form.endAt ? new Date(form.endAt).toISOString() : null,
    is_public: form.isPublic,
  };
}

function getFieldError(error: unknown, field: string): string | undefined {
  return error instanceof ApiClientError ? error.fields?.[field]?.[0] : undefined;
}

export default function StaffCalendarPage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [courseFilter, setCourseFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>("");
  const [form, setForm] = useState<CalendarFormState>(emptyForm);
  const [editingEvent, setEditingEvent] = useState<StaffCalendarEventDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<StaffCalendarEventDto | null>(null);
  const canManage = can("calendar.manage");
  const listParams = useMemo<StaffCalendarParams>(() => ({
    course: courseFilter ? Number(courseFilter) : undefined,
    eventType: eventTypeFilter || undefined,
    page,
    pageSize: PAGE_SIZE,
  }), [courseFilter, eventTypeFilter, page]);
  const eventsQuery = useQuery({
    queryFn: () => calendarApi.staff(listParams),
    queryKey: calendarKeys.staff(listParams),
  });
  const coursesQuery = useQuery({
    queryFn: () => coursesApi.list(courseParams),
    queryKey: courseKeys.list(courseParams),
  });
  const saveMutation = useMutation({
    mutationFn: (payload: StaffCalendarEventPayload) => editingEvent
      ? calendarApi.update(editingEvent.id, payload)
      : calendarApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      setIsFormOpen(false);
      setEditingEvent(null);
      setForm(emptyForm);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (eventId: number) => calendarApi.remove(eventId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      setPendingDelete(null);
    },
  });
  const courseNames = useMemo(
    () => new Map((coursesQuery.data?.results ?? []).map((course) => [course.id, `${course.code} · ${course.title}`])),
    [coursesQuery.data?.results],
  );

  const openCreate = () => {
    saveMutation.reset();
    setEditingEvent(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (event: StaffCalendarEventDto) => {
    saveMutation.reset();
    setEditingEvent(event);
    setForm({
      course: String(event.course),
      title: event.title,
      description: event.description,
      eventType: event.event_type,
      startAt: toLocalDateTime(event.start_at),
      endAt: event.end_at ? toLocalDateTime(event.end_at) : "",
      isPublic: event.is_public,
    });
    setIsFormOpen(true);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate(toPayload(form));
  };

  if (!can("calendar.view")) {
    return <StatePanel description="Backend не выдал permission calendar.view." kind="error" title="Календарь недоступен" />;
  }

  if (eventsQuery.isPending || coursesQuery.isPending) {
    return <StatePanel description="Получаем события и доступные курсы с backend." kind="loading" title="Загрузка календаря" />;
  }

  if (eventsQuery.isError || coursesQuery.isError) {
    const error = eventsQuery.error ?? coursesQuery.error;
    return <StatePanel description={error?.message ?? "Не удалось загрузить данные."} kind="error" title="Календарь недоступен" />;
  }

  const events = eventsQuery.data.results;
  const totalPages = Math.max(1, Math.ceil(eventsQuery.data.count / PAGE_SIZE));

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 rounded-brand border-2 border-line bg-paper p-5 sm:flex-row sm:items-end sm:justify-between lg:p-7">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Release 1 Calendar</span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">Календарь</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ash">
            События курсов из backend с учётом object scope и permissions текущего пользователя.
          </p>
        </div>
        {canManage ? (
          <button className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white" onClick={openCreate} type="button">
            <Plus aria-hidden="true" size={18} /> Добавить событие
          </button>
        ) : null}
      </header>

      <section aria-label="Фильтры календаря" className="grid gap-3 rounded-brand border-2 border-line bg-mist p-4 md:grid-cols-2">
        <FilterSelect label="Курс" onChange={(value) => { setCourseFilter(value); setPage(1); }} value={courseFilter}>
          <option value="">Все курсы</option>
          {coursesQuery.data.results.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.title}</option>)}
        </FilterSelect>
        <FilterSelect label="Тип события" onChange={(value) => { setEventTypeFilter(value as EventTypeFilter); setPage(1); }} value={eventTypeFilter}>
          <option value="">Все типы</option>
          {(Object.entries(eventTypeLabels) as Array<[CalendarEventType, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </FilterSelect>
      </section>

      {deleteMutation.isError ? (
        <p className="rounded-brand border-2 border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800" role="alert">
          {deleteMutation.error.message}
        </p>
      ) : null}

      {events.length ? (
        <section className="grid gap-3">
          {events.map((event) => (
            <article className="grid gap-4 rounded-brand border-2 border-line bg-paper p-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center" key={event.id}>
              <span className="grid size-14 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-macaw-dark">
                <CalendarDays aria-hidden="true" size={24} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-brand border-2 border-eel bg-eel/20 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-ecto-dark">{eventTypeLabels[event.event_type]}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-ash">{event.is_public ? "Публичное" : "Внутреннее"}</span>
                </div>
                <h2 className="mt-2 text-lg font-black text-navy">{event.title}</h2>
                <p className="mt-1 text-sm text-ash">{courseNames.get(event.course) ?? `Курс #${event.course}`}</p>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-graphite">
                  <Clock3 aria-hidden="true" size={15} /> {dateFormatter.format(new Date(event.start_at))}
                  {event.end_at ? ` — ${dateFormatter.format(new Date(event.end_at))}` : ""}
                </p>
                {event.description ? <p className="mt-2 text-xs leading-5 text-ash">{event.description}</p> : null}
              </div>
              {canManage ? (
                <div className="flex gap-2">
                  <button aria-label={`Редактировать ${event.title}`} className="grid size-10 place-items-center rounded-brand border-2 border-line text-graphite hover:border-macaw hover:text-macaw-dark" onClick={() => openEdit(event)} type="button"><Edit3 aria-hidden="true" size={17} /></button>
                  <button aria-label={`Удалить ${event.title}`} className="grid size-10 place-items-center rounded-brand border-2 border-red-300 text-red-700 hover:bg-red-50" onClick={() => setPendingDelete(event)} type="button"><Trash2 aria-hidden="true" size={17} /></button>
                </div>
              ) : null}
            </article>
          ))}
          {totalPages > 1 ? (
            <nav aria-label="Пагинация событий" className="flex items-center justify-between rounded-brand border-2 border-line bg-paper p-3">
              <button aria-label="Предыдущая страница" className="grid size-10 place-items-center rounded-brand border-2 border-line disabled:opacity-40" disabled={!eventsQuery.data.previous} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button"><ChevronLeft aria-hidden="true" size={18} /></button>
              <span className="text-xs font-black text-ash">Страница {page} из {totalPages}</span>
              <button aria-label="Следующая страница" className="grid size-10 place-items-center rounded-brand border-2 border-line disabled:opacity-40" disabled={!eventsQuery.data.next} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} type="button"><ChevronRight aria-hidden="true" size={18} /></button>
            </nav>
          ) : null}
        </section>
      ) : (
        <StatePanel description="Измените фильтры или создайте первое событие курса." icon={CalendarDays} title="Событий пока нет" />
      )}

      {isFormOpen ? (
        <CalendarEventDialog
          error={saveMutation.error}
          form={form}
          isEditing={Boolean(editingEvent)}
          isPending={saveMutation.isPending}
          onChange={setForm}
          onClose={() => setIsFormOpen(false)}
          onSubmit={submit}
          courses={coursesQuery.data.results}
        />
      ) : null}

      <ConfirmDialog
        confirmLabel="Удалить"
        description={pendingDelete ? `Событие «${pendingDelete.title}» будет удалено из backend.` : ""}
        isOpen={Boolean(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
        title="Удалить событие?"
      />
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
  return <label className="grid gap-1 text-[10px] font-black uppercase tracking-wider text-ash"><span>{label}</span><select className="h-12 rounded-brand border-2 border-line bg-paper px-3 text-sm font-bold normal-case tracking-normal text-graphite outline-none focus:border-macaw" onChange={(event) => onChange(event.target.value)} value={value}>{children}</select></label>;
}

interface CalendarEventDialogProps {
  courses: Array<{ id: number; code: string; title: string }>;
  error: unknown;
  form: CalendarFormState;
  isEditing: boolean;
  isPending: boolean;
  onChange: React.Dispatch<React.SetStateAction<CalendarFormState>>;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function CalendarEventDialog({ courses, error, form, isEditing, isPending, onChange, onClose, onSubmit }: CalendarEventDialogProps) {
  return (
    <div aria-labelledby="calendar-event-title" aria-modal="true" className="fixed inset-0 z-[115] grid place-items-center bg-midnight/75 p-4" role="dialog">
      <form className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-brand border-2 border-line bg-paper p-5" onSubmit={onSubmit}>
        <header className="flex items-start justify-between gap-4">
          <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-ecto-dark">Calendar Event</span><h2 className="mt-1 text-xl font-black text-navy" id="calendar-event-title">{isEditing ? "Редактировать событие" : "Новое событие"}</h2></div>
          <button aria-label="Закрыть" className="grid size-10 place-items-center rounded-brand border-2 border-line text-ash" disabled={isPending} onClick={onClose} type="button"><X aria-hidden="true" size={18} /></button>
        </header>
        {error instanceof Error ? <p className="mt-4 rounded-brand border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{error.message}</p> : null}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FormSelect id="calendar-event-course" label="Курс" value={form.course} onChange={(value) => onChange((current) => ({ ...current, course: value }))}><option value="">Выберите курс</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.title}</option>)}</FormSelect>
          <FormSelect id="calendar-event-type" label="Тип" value={form.eventType} onChange={(value) => onChange((current) => ({ ...current, eventType: value as CalendarEventType }))}>{(Object.entries(eventTypeLabels) as Array<[CalendarEventType, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FormSelect>
          <FormInput error={getFieldError(error, "title")} id="calendar-event-name" label="Название" onChange={(value) => onChange((current) => ({ ...current, title: value }))} required value={form.title} />
          <FormInput error={getFieldError(error, "start_at")} id="calendar-event-start" label="Начало" onChange={(value) => onChange((current) => ({ ...current, startAt: value }))} required type="datetime-local" value={form.startAt} />
          <FormInput error={getFieldError(error, "end_at")} id="calendar-event-end" label="Окончание" onChange={(value) => onChange((current) => ({ ...current, endAt: value }))} type="datetime-local" value={form.endAt} />
          <label className="flex items-center gap-3 rounded-brand border-2 border-line p-3 text-sm font-black text-graphite"><input checked={form.isPublic} className="size-5 accent-ecto-dark" onChange={(event) => onChange((current) => ({ ...current, isPublic: event.target.checked }))} type="checkbox" />Показывать студентам</label>
        </div>
        <label className="mt-4 grid gap-1 text-xs font-black text-ash">Описание<textarea className="min-h-28 rounded-brand border-2 border-line p-3 text-sm font-bold text-graphite outline-none focus:border-macaw" onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))} value={form.description} /></label>
        <div className="mt-5 flex gap-3 sm:justify-end"><button className="min-h-11 flex-1 rounded-brand border-2 border-line px-5 text-sm font-black sm:flex-none" disabled={isPending} onClick={onClose} type="button">Отмена</button><button className="student-pressable min-h-11 flex-1 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white disabled:opacity-50 sm:flex-none" disabled={!form.course || !form.title.trim() || !form.startAt || isPending} type="submit">{isPending ? "Сохраняем…" : "Сохранить"}</button></div>
      </form>
    </div>
  );
}

interface FormSelectProps extends FilterSelectProps {
  id: string;
}

function FormSelect({ children, id, label, onChange, value }: FormSelectProps) {
  return <div className="grid gap-1 text-xs font-black text-ash"><label htmlFor={id}>{label}</label><select className="h-12 rounded-brand border-2 border-line bg-paper px-3 text-sm font-bold text-graphite outline-none focus:border-macaw" id={id} onChange={(event) => onChange(event.target.value)} required value={value}>{children}</select></div>;
}

interface FormInputProps {
  error?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "datetime-local" | "text";
  value: string;
}

function FormInput({ error, id, label, onChange, required, type = "text", value }: FormInputProps) {
  return <div className="grid gap-1 text-xs font-black text-ash"><label htmlFor={id}>{label}</label><input aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} className="h-12 rounded-brand border-2 border-line px-3 text-sm font-bold text-graphite outline-none focus:border-macaw" id={id} onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value} />{error ? <span className="text-[11px] text-red-700" id={`${id}-error`}>{error}</span> : null}</div>;
}
