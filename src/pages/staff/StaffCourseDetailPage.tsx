import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  FolderTree,
  Layers3,
  RotateCcw,
  Send,
  Settings2,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { courseKeys } from "../../api/courseKeys";
import { coursesApi } from "../../api/courses.api";
import type { CourseCopyPayload, CourseLifecycleAction } from "../../api/courses.api";
import { queryClient } from "../../api/queryClient";
import { useAuth } from "../../auth/useAuth";
import ApiCourseStatusBadge from "../../components/staff/ApiCourseStatusBadge";
import CourseCopyDialog from "../../components/staff/CourseCopyDialog";
import CourseEnrollmentsPanel from "../../components/staff/CourseEnrollmentsPanel";
import StaffToast from "../../components/staff/StaffToast";
import type { ToastMessage } from "../../components/staff/StaffToast";
import ConfirmDialog from "../../components/student/ConfirmDialog";
import StatePanel from "../../components/student/StatePanel";
import { cn } from "../../utils/cn";

type Tab = "overview" | "enrollments" | "readiness" | "settings" | "history";

interface RouteParams { courseId: string; }

interface PendingAction {
  action: CourseLifecycleAction | "delete";
  title: string;
  description: string;
  confirmLabel: string;
  successTitle: string;
}

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
const historyActionLabels: Record<string, string> = {
  course_created: "Курс создан",
  course_updated: "Данные курса изменены",
  module_created: "Модуль создан",
  module_updated: "Модуль изменён",
  module_deleted: "Модуль удалён",
  topic_created: "Тема создана",
  topic_updated: "Тема изменена",
  topic_deleted: "Тема удалена",
  lesson_created: "Урок создан",
  lesson_updated: "Урок изменён",
  lesson_deleted: "Урок удалён",
  material_uploaded: "Материал загружен",
  material_deleted: "Материал удалён",
  submitted_for_review: "Курс отправлен на проверку",
  returned_for_revision: "Курс возвращён на доработку",
  published: "Курс опубликован",
  archived: "Курс архивирован",
  restored: "Курс восстановлен",
  copied: "Курс скопирован",
};
const readinessLabels: Record<string, string> = {
  metadata: "Основные данные заполнены",
  teacher: "Преподаватель назначен",
  syllabus: "Syllabus загружен",
  structure: "Структура курса создана",
};

export default function StaffCourseDetailPage() {
  const { courseId } = useParams<RouteParams>();
  const numericCourseId = Number(courseId);
  const historyNavigation = useHistory();
  const { can } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnComment, setReturnComment] = useState("");
  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const enabled = Number.isInteger(numericCourseId) && numericCourseId > 0;
  const courseQuery = useQuery({ queryKey: courseKeys.detail(numericCourseId), queryFn: () => coursesApi.detail(numericCourseId), enabled });
  const readinessQuery = useQuery({ queryKey: courseKeys.readiness(numericCourseId), queryFn: () => coursesApi.readiness(numericCourseId), enabled });
  const historyQuery = useQuery({ queryKey: courseKeys.history(numericCourseId), queryFn: () => coursesApi.history(numericCourseId), enabled });

  const refreshCourse = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: courseKeys.all }),
      queryClient.invalidateQueries({ queryKey: courseKeys.readiness(numericCourseId) }),
      queryClient.invalidateQueries({ queryKey: courseKeys.history(numericCourseId) }),
    ]);
  };

  const lifecycleMutation = useMutation({
    mutationFn: ({ action, comment }: { action: CourseLifecycleAction | "return-for-revision"; comment?: string }) => action === "return-for-revision" ? coursesApi.returnForRevision(numericCourseId, comment ?? "") : coursesApi.transition(numericCourseId, action),
    onSuccess: async (_, variables) => {
      await refreshCourse();
      setToast({ id: Date.now(), title: variables.action === "return-for-revision" ? "Курс возвращён на доработку" : pendingAction?.successTitle ?? "Статус курса обновлён" });
      setPendingAction(null);
      setIsReturnOpen(false);
      setReturnComment("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => coursesApi.remove(numericCourseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      historyNavigation.push("/courses");
    },
  });

  const copyMutation = useMutation({
    mutationFn: (payload: CourseCopyPayload) => coursesApi.copy(numericCourseId, payload),
    onSuccess: async (copiedCourse) => {
      await queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      historyNavigation.push(`/courses/${copiedCourse.id}`);
    },
  });

  if (!enabled) return <StatePanel description="Идентификатор курса в адресе должен быть положительным числом." kind="error" title="Некорректный адрес курса" />;
  if (courseQuery.isPending) return <StatePanel description="Получаем карточку курса с сервера." kind="loading" title="Загрузка курса" />;
  if (courseQuery.isError) return <StatePanel action={<Link className="mt-2 text-sm font-black text-macaw-dark hover:underline" to="/courses">Вернуться к курсам</Link>} description={courseQuery.error.message} kind="error" title="Курс недоступен" />;

  const course = courseQuery.data;
  const isMutating = lifecycleMutation.isPending || deleteMutation.isPending || copyMutation.isPending;
  const mutationError = lifecycleMutation.error ?? deleteMutation.error;
  const ask = (action: PendingAction) => setPendingAction(action);
  const confirmAction = () => {
    if (!pendingAction) return;
    if (pendingAction.action === "delete") deleteMutation.mutate();
    else lifecycleMutation.mutate({ action: pendingAction.action });
  };
  const tabs: Array<[Tab, string]> = [
    ["overview", "Обзор"],
    ...(can("enrollments.view") ? [["enrollments", "Студенты"] as [Tab, string]] : []),
    ["readiness", "Готовность"],
    ["settings", "Системные данные"],
    ["history", "История"],
  ];

  return (
    <div className="grid gap-6">
      <Link className="inline-flex w-fit items-center gap-2 text-sm font-black text-ash hover:text-macaw-dark" to="/courses"><ArrowLeft aria-hidden="true" size={17} /> Назад к курсам</Link>

      <section className="overflow-hidden rounded-brand border-2 border-line bg-paper">
        <div className="grid min-h-48 place-items-center bg-eel/25 p-6">
          {course.cover ? <img alt={`Обложка курса ${course.title}`} className="h-full max-h-64 w-full object-cover" src={course.cover} /> : <div className="grid justify-items-center gap-3 text-center text-ecto-dark"><BookOpen aria-hidden="true" size={44} strokeWidth={1.8} /><span className="text-xs font-black uppercase tracking-[0.18em]">{course.code}</span></div>}
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-start lg:p-7">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><ApiCourseStatusBadge status={course.status} /><span className="rounded-brand border-2 border-line px-2.5 py-1 text-[11px] font-black text-ash">{course.code}</span></div>
            <div className="flex flex-wrap items-center gap-2"><ApiCourseStatusBadge status={course.status} /><span className="rounded-brand border-2 border-line px-2.5 py-1 text-[11px] font-black text-ash">{course.code}</span>{course.group ? <span className="rounded-brand border-2 border-macaw/30 bg-macaw/10 px-2.5 py-1 text-[11px] font-black text-macaw-dark">Группа {course.group.name}</span> : null}</div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-navy sm:text-4xl">{course.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ash">{course.description || "Описание курса не заполнено."}</p>
            {course.review_comment ? <div className="mt-4 rounded-brand border-2 border-warning/40 bg-warning/10 p-4"><strong className="text-xs font-black uppercase tracking-wider text-warning-dark">Комментарий проверки</strong><p className="mt-2 text-sm text-graphite">{course.review_comment}</p></div> : null}
          </div>
          <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
            {can("course_structure.view") ? <Link className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-macaw px-4 text-sm font-black text-macaw-dark hover:bg-macaw/10" to={`/courses/${course.id}/preview`}><Eye aria-hidden="true" size={17} /> Preview</Link> : null}
            {can("course_structure.view") ? <Link className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-ecto px-4 text-sm font-black text-ecto-dark hover:bg-ecto/10" to={`/courses/${course.id}/builder`}><FolderTree aria-hidden="true" size={17} /> Course Builder</Link> : null}
            {can("courses.copy") ? <button className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-line px-4 text-sm font-black text-graphite hover:border-lingot" disabled={isMutating} onClick={() => { copyMutation.reset(); setIsCopyOpen(true); }} type="button"><Copy aria-hidden="true" size={17} /> Копировать</button> : null}
            {can("courses.edit") && course.status !== "archived" ? <Link className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-line px-4 text-sm font-black text-graphite hover:border-lingot" to={`/courses/${course.id}/edit`}><Edit3 aria-hidden="true" size={17} /> Редактировать</Link> : null}
            {(course.status === "draft" || course.status === "needs_revision") && can("courses.submit_review") ? <button className="student-pressable inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white disabled:opacity-50" disabled={!readinessQuery.data?.ready_for_review || isMutating} onClick={() => ask({ action: "submit-review", title: "Отправить курс на проверку?", description: "Backend проверит готовность и переведёт курс в статус проверки.", confirmLabel: "Отправить", successTitle: "Курс отправлен на проверку" })} title={!readinessQuery.data?.ready_for_review ? "Сначала устраните замечания готовности" : undefined} type="button"><Send aria-hidden="true" size={17} /> На проверку</button> : null}
            {course.status === "under_review" && can("courses.review") ? <button className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-warning px-4 text-sm font-black text-warning-dark hover:bg-warning/10" disabled={isMutating} onClick={() => setIsReturnOpen(true)} type="button"><RotateCcw aria-hidden="true" size={17} /> Вернуть</button> : null}
            {course.status === "under_review" && can("courses.publish") ? <button className="student-pressable inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white" disabled={isMutating} onClick={() => ask({ action: "publish", title: "Опубликовать курс?", description: "Курс станет доступен студентам согласно правилам backend.", confirmLabel: "Опубликовать", successTitle: "Курс опубликован" })} type="button"><CheckCircle2 aria-hidden="true" size={17} /> Опубликовать</button> : null}
            {course.status === "published" && can("courses.archive") ? <button className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-line px-4 text-sm font-black text-graphite hover:border-warning" disabled={isMutating} onClick={() => ask({ action: "archive", title: "Архивировать курс?", description: "Курс будет скрыт из списка активных курсов студентов.", confirmLabel: "Архивировать", successTitle: "Курс архивирован" })} type="button"><Archive aria-hidden="true" size={17} /> Архивировать</button> : null}
            {course.status === "archived" && can("courses.archive") ? <button className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-line px-4 text-sm font-black text-graphite hover:border-lingot" disabled={isMutating} onClick={() => ask({ action: "restore", title: "Восстановить курс?", description: "Backend вернёт курс в разрешённый рабочий статус.", confirmLabel: "Восстановить", successTitle: "Курс восстановлен" })} type="button"><RotateCcw aria-hidden="true" size={17} /> Восстановить</button> : null}
            {course.status === "draft" && can("courses.delete") ? <button className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-red-300 px-4 text-sm font-black text-red-700 hover:bg-red-50" disabled={isMutating} onClick={() => ask({ action: "delete", title: "Удалить черновик навсегда?", description: "Это действие нельзя отменить. Backend разрешает удаление только курсов в статусе Draft.", confirmLabel: "Удалить", successTitle: "Курс удалён" })} type="button"><Trash2 aria-hidden="true" size={17} /> Удалить</button> : null}
          </div>
        </div>
      </section>

      {mutationError ? <div className="rounded-brand border-2 border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800" role="alert">{mutationError.message}</div> : null}

      <nav aria-label="Разделы курса" className="flex gap-2 overflow-x-auto rounded-brand border-2 border-line bg-paper p-2">{tabs.map(([value, label]) => <button className={cn("min-h-10 shrink-0 rounded-brand border-2 px-4 text-sm font-black", activeTab === value ? "border-ecto bg-ecto/10 text-ecto-dark" : "border-transparent text-ash hover:bg-mist hover:text-graphite")} key={value} onClick={() => setActiveTab(value)} type="button">{label}</button>)}</nav>

      {activeTab === "overview" ? <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7"><h2 className="text-xl font-black text-navy">Информация о курсе</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><Meta icon={UserRound} label="Преподаватель" value={course.teacher?.full_name ?? "Не назначен"} /><Meta icon={CalendarDays} label="Семестр" value={course.semester.name} /><Meta icon={BookOpen} label="Факультет" value={`${course.faculty.name} (${course.faculty.code ?? "—"})`} /><Meta icon={Layers3} label="Кафедра" value={`${course.department.name} (${course.department.code ?? "—"})`} /><Meta icon={Settings2} label="Программа" value={`${course.program.name} (${course.program.code ?? "—"})`} /><Meta icon={CalendarDays} label="Период" value={`${formatDate(course.start_date)} — ${formatDate(course.end_date)}`} /></dl></section> : null}
      {activeTab === "overview" ? <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7"><h2 className="text-xl font-black text-navy">Информация о курсе</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><Meta icon={UserRound} label="Преподаватель" value={course.teacher?.full_name ?? "Не назначен"} /><Meta icon={CalendarDays} label="Семестр" value={course.semester.name} /><Meta icon={BookOpen} label="Факультет" value={`${course.faculty.name} (${course.faculty.code ?? "—"})`} /><Meta icon={Layers3} label="Кафедра" value={`${course.department.name} (${course.department.code ?? "—"})`} /><Meta icon={Settings2} label="Программа" value={`${course.program.name} (${course.program.code ?? "—"})`} /><Meta icon={FolderTree} label="Группа" value={course.group ? `${course.group.name}${course.group.admission_year ? ` (${course.group.admission_year})` : ""}` : "Все группы / Общий курс"} /><Meta icon={CalendarDays} label="Период" value={`${formatDate(course.start_date)} — ${formatDate(course.end_date)}`} /></dl></section> : null}

      {activeTab === "enrollments" && can("enrollments.view") ? <CourseEnrollmentsPanel courseId={course.id} /> : null}

      {activeTab === "readiness" ? <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7"><div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-black text-navy">Готовность курса</h2><p className="mt-1 text-xs text-ash">Проверяется backend перед отправкой на review.</p></div><strong className="text-3xl font-black text-ecto-dark">{readinessQuery.data?.score ?? 0}%</strong></div>{readinessQuery.isError ? <p className="mt-5 text-sm font-bold text-red-700">{readinessQuery.error.message}</p> : <><div className="mt-4 h-3 overflow-hidden rounded-brand bg-mist"><span className="block h-full rounded-brand bg-ecto" style={{ width: `${readinessQuery.data?.score ?? 0}%` }} /></div><div className="mt-5 grid gap-3">{readinessQuery.data?.checks.map((item) => <div className="flex items-start gap-3 text-sm font-bold" key={item.key}><span className={cn("grid size-6 shrink-0 place-items-center rounded-brand border-2", item.status === "complete" ? "border-ecto bg-ecto text-white" : "border-warning text-warning-dark")}>{item.status === "complete" ? <Check aria-hidden="true" size={14} /> : <X aria-hidden="true" size={14} />}</span><div><span className={item.status === "complete" ? "text-graphite" : "text-ash"}>{readinessLabels[item.key] ?? item.key}</span>{item.message ? <p className="mt-1 text-xs font-normal text-ash">{item.message}</p> : null}</div></div>)}</div></>}</section> : null}

      {activeTab === "settings" ? <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7"><h2 className="text-xl font-black text-navy">Системная информация</h2><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3"><SystemMeta label="ID курса" value={String(course.id)} /><SystemMeta label="Язык" value={course.language.toUpperCase()} /><SystemMeta label="Кредиты" value={String(course.credits)} /><SystemMeta label="Создан" value={formatDate(course.created_at)} /><SystemMeta label="Обновлён" value={formatDate(course.updated_at)} /><SystemMeta label="Опубликован" value={course.published_at ? formatDate(course.published_at) : "—"} /></dl>{course.syllabus ? <a className="mt-5 inline-flex text-sm font-black text-macaw-dark hover:underline" href={course.syllabus} rel="noreferrer" target="_blank">Открыть syllabus</a> : null}</section> : null}

      {activeTab === "history" ? <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7"><h2 className="text-xl font-black text-navy">История действий</h2>{historyQuery.isError ? <p className="mt-5 text-sm font-bold text-red-700">{historyQuery.error.message}</p> : historyQuery.data?.results.length ? <div className="mt-5 grid gap-4">{historyQuery.data.results.map((event) => <article className="grid gap-2 border-l-4 border-lingot pl-4 sm:grid-cols-[1fr_auto]" key={event.id}><div><strong className="text-sm font-black text-graphite">{historyActionLabels[event.action] ?? event.action}</strong><span className="mt-1 block text-xs text-ash">{event.actor?.full_name ?? "Система"}</span></div><time className="text-xs font-bold text-ash">{formatDate(event.created_at)}</time></article>)}</div> : <p className="mt-5 rounded-brand bg-mist p-4 text-sm text-ash">История действий пока пуста.</p>}</section> : null}

      <ConfirmDialog confirmLabel={pendingAction?.confirmLabel ?? "Продолжить"} description={pendingAction?.description ?? ""} isOpen={Boolean(pendingAction)} onCancel={() => setPendingAction(null)} onConfirm={confirmAction} title={pendingAction?.title ?? "Подтвердите действие"} />

      {isReturnOpen ? <div aria-labelledby="return-course-title" aria-modal="true" className="fixed inset-0 z-[110] grid place-items-center bg-midnight/70 p-4" role="dialog"><div className="w-full max-w-lg rounded-brand border-2 border-line bg-paper p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black text-navy" id="return-course-title">Вернуть курс на доработку</h2><p className="mt-2 text-sm text-ash">Комментарий обязателен и будет сохранён backend.</p></div><button aria-label="Закрыть" className="grid size-9 place-items-center rounded-brand border-2 border-line text-ash" onClick={() => setIsReturnOpen(false)} type="button"><X aria-hidden="true" size={17} /></button></div><label className="mt-5 grid gap-2 text-xs font-black uppercase tracking-wider text-ash">Причина возврата<textarea autoFocus className="min-h-32 rounded-brand border-2 border-line p-3 text-sm font-bold normal-case tracking-normal text-graphite outline-none focus:border-macaw" onChange={(event) => setReturnComment(event.target.value)} placeholder="Опишите, что необходимо исправить" value={returnComment} /></label><div className="mt-5 grid grid-cols-2 gap-3"><button className="min-h-11 rounded-brand border-2 border-line text-sm font-black text-graphite" onClick={() => setIsReturnOpen(false)} type="button">Отмена</button><button className="student-pressable min-h-11 rounded-brand border-2 border-warning bg-warning px-4 text-sm font-black text-midnight disabled:opacity-50" disabled={!returnComment.trim() || isMutating} onClick={() => lifecycleMutation.mutate({ action: "return-for-revision", comment: returnComment.trim() })} type="button">Вернуть</button></div></div></div> : null}

      {isCopyOpen ? <CourseCopyDialog error={copyMutation.error?.message} initialCode={`${course.code}-COPY`} initialTitle={`${course.title} — копия`} isPending={copyMutation.isPending} onClose={() => { copyMutation.reset(); setIsCopyOpen(false); }} onSubmit={(payload) => copyMutation.mutate(payload)} submitLabel="Скопировать" title="Копировать курс" /> : null}

      <StaffToast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function formatDate(value: string): string { return dateFormatter.format(new Date(value)); }

interface MetaProps { icon: typeof UserRound; label: string; value: string; }
function Meta({ icon: Icon, label, value }: MetaProps) { return <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-brand bg-mist text-macaw-dark"><Icon aria-hidden="true" size={19} /></span><div><dt className="text-[10px] font-black uppercase tracking-wider text-ash">{label}</dt><dd className="mt-1 text-sm font-black text-graphite">{value}</dd></div></div>; }
function SystemMeta({ label, value }: { label: string; value: string }) { return <div className="rounded-brand border-2 border-line p-4"><dt className="text-[10px] font-black uppercase tracking-wider text-ash">{label}</dt><dd className="mt-1 break-all font-black text-graphite">{value}</dd></div>; }
