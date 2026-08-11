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
  FileText,
  FolderTree,
  Layers3,
  RotateCcw,
  Send,
  Settings2,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import CourseLifecycle from "../../components/staff/CourseLifecycle";
import CourseReviewIssuesDialog from "../../components/staff/CourseReviewIssuesDialog";
import CourseStatusBadge from "../../components/staff/CourseStatusBadge";
import StaffToast from "../../components/staff/StaffToast";
import type { ToastMessage } from "../../components/staff/StaffToast";
import ConfirmDialog from "../../components/student/ConfirmDialog";
import {
  mockDepartments,
  mockFaculties,
  mockPrograms,
  mockSemesters,
} from "../../data/mock/mockOrganization";
import { mockStaffUsers } from "../../data/mock/mockUsers";
import {
  changeCourseStatus,
  getCourse,
  getCourseHistory,
  getCourseReadiness,
  getCourseReviewIssues,
  subscribeCourseStore,
} from "../../services/courseService";
import type { CourseReviewIssue } from "../../services/courseService";
import { getStaffSession } from "../../services/staffSession";
import { copyCourse } from "../../services/courseTemplateService";
import { getCourseMaterials } from "../../services/materialService";
import type { CourseStatus } from "../../types/staff";
import { cn } from "../../utils/cn";

type Tab = "overview" | "structure" | "materials" | "settings" | "history";

interface RouteParams {
  courseId: string;
}

interface PendingStatusAction {
  status: CourseStatus;
  title: string;
  description: string;
  confirmLabel: string;
}

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default function StaffCourseDetailPage() {
  const { courseId } = useParams<RouteParams>();
  const historyNavigation = useHistory();
  const session = getStaffSession();
  const [, setRevision] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [pendingAction, setPendingAction] = useState<PendingStatusAction | null>(null);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnComment, setReturnComment] = useState("");
  const [reviewIssues, setReviewIssues] = useState<CourseReviewIssue[]>([]);
  const [isPublishedEditPending, setIsPublishedEditPending] = useState(false);
  const [isCopyPending, setIsCopyPending] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => subscribeCourseStore(() => setRevision((value) => value + 1)), []);
  const course = getCourse(courseId);
  const history = getCourseHistory(courseId);
  const materials = getCourseMaterials(courseId);
  const readiness = useMemo(() => (course ? getCourseReadiness(course) : null), [course]);
  const closeToast = useCallback(() => setToast(null), []);

  if (!course || !session) {
    return (
      <div className="grid min-h-96 place-items-center rounded-brand border-2 border-line p-6 text-center">
        <div>
          <h1 className="text-2xl font-black text-navy">Курс не найден</h1>
          <Link className="mt-4 inline-block text-sm font-black text-macaw-dark hover:underline" to="/courses">Вернуться к курсам</Link>
        </div>
      </div>
    );
  }

  const teacher = mockStaffUsers.find((user) => user.id === course.teacherId);
  const faculty = mockFaculties.find((item) => item.id === course.facultyId);
  const department = mockDepartments.find((item) => item.id === course.departmentId);
  const program = mockPrograms.find((item) => item.id === course.programId);
  const semester = mockSemesters.find((item) => item.id === course.semesterId);
  const canReview = session.role === "content-manager" || session.role === "admin";

  const submitForReview = () => {
    const issues = getCourseReviewIssues(course.id);
    if (issues.length) {
      setReviewIssues(issues);
      return;
    }
    setPendingAction({
      status: "under-review",
      title: "Отправить курс на проверку?",
      description: "Редакторы увидят текущую структуру, уроки и материалы курса.",
      confirmLabel: "Отправить",
    });
  };

  const confirmStatusChange = () => {
    if (!pendingAction) return;
    changeCourseStatus(course.id, pendingAction.status, session.userId);
    setToast({
      id: Date.now(),
      title:
        pendingAction.status === "published"
          ? "Курс опубликован"
          : pendingAction.status === "archived"
            ? "Курс архивирован"
            : pendingAction.status === "under-review"
              ? "Курс отправлен на проверку"
              : "Курс восстановлен",
    });
    setPendingAction(null);
  };

  const returnForRevision = () => {
    if (!returnComment.trim()) return;
    changeCourseStatus(course.id, "draft", session.userId, returnComment.trim());
    setReturnComment("");
    setIsReturnOpen(false);
    setToast({ id: Date.now(), title: "Курс возвращён на доработку" });
  };

  const confirmCourseCopy = () => {
    const copied = copyCourse(course.id, session.userId);
    setIsCopyPending(false);
    setToast({
      id: Date.now(),
      title: "Курс скопирован",
      description: `Создан новый черновик ${copied.code}`,
    });
  };

  return (
    <div className="grid gap-6">
      <Link className="inline-flex w-fit items-center gap-2 text-sm font-black text-ash hover:text-macaw-dark" to="/courses">
        <ArrowLeft aria-hidden="true" size={17} /> Назад к курсам
      </Link>

      <section className="overflow-hidden rounded-brand border-2 border-line bg-paper">
        <div className="grid min-h-48 place-items-center bg-eel/25 p-6">
          {course.coverDataUrl ? (
            <img alt={`Обложка курса ${course.title}`} className="h-full max-h-64 w-full object-cover" src={course.coverDataUrl} />
          ) : (
            <div className="grid justify-items-center gap-3 text-center text-ecto-dark">
              <BookOpen aria-hidden="true" size={44} strokeWidth={1.8} />
              <span className="text-xs font-black uppercase tracking-[0.18em]">{course.code}</span>
            </div>
          )}
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-start lg:p-7">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CourseStatusBadge status={course.status} />
              <span className="rounded-brand border-2 border-line px-2.5 py-1 text-[11px] font-black text-ash">{course.code}</span>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-navy sm:text-4xl">{course.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ash">{course.description}</p>
            {course.reviewComment ? (
              <div className="mt-4 rounded-brand border-2 border-warning/40 bg-warning/10 p-4">
                <strong className="text-xs font-black uppercase tracking-wider text-warning-dark">Комментарий проверки</strong>
                <p className="mt-2 text-sm text-graphite">{course.reviewComment}</p>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
            <Link className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-ecto px-4 text-sm font-black text-ecto-dark hover:bg-ecto/10" to={`/courses/${course.id}/builder`}>
              <FolderTree aria-hidden="true" size={17} /> Открыть Builder
            </Link>
            <Link className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-macaw px-4 text-sm font-black text-macaw-dark hover:bg-macaw/10" to={`/courses/${course.id}/preview`}>
              <Eye aria-hidden="true" size={17} /> Preview
            </Link>
            {course.status === "published" ? (
              <button className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-warning px-4 text-sm font-black text-warning-dark hover:bg-warning/10" onClick={() => setIsPublishedEditPending(true)} type="button">
                <Edit3 aria-hidden="true" size={17} /> Редактировать
              </button>
            ) : (
              <Link className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-line px-4 text-sm font-black text-graphite hover:border-lingot" to={`/courses/${course.id}/edit`}>
                <Edit3 aria-hidden="true" size={17} /> Редактировать
              </Link>
            )}
            {canReview ? (
              <button className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-line px-4 text-sm font-black text-graphite hover:border-lingot hover:bg-eel/10" onClick={() => setIsCopyPending(true)} type="button">
                <Copy aria-hidden="true" size={17} /> Копировать
              </button>
            ) : null}
            {course.status === "draft" ? (
              <button className="student-pressable inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white" onClick={submitForReview} type="button">
                <Send aria-hidden="true" size={17} /> Отправить на проверку
              </button>
            ) : null}
            {course.status === "under-review" && canReview ? (
              <>
                <button className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-warning px-4 text-sm font-black text-warning-dark hover:bg-warning/10" onClick={() => setIsReturnOpen(true)} type="button"><RotateCcw aria-hidden="true" size={17} /> Вернуть</button>
                <button className="student-pressable inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white" onClick={() => setPendingAction({ status: "published", title: "Опубликовать курс?", description: "После публикации курс станет доступен студентам.", confirmLabel: "Опубликовать" })} type="button"><CheckCircle2 aria-hidden="true" size={17} /> Опубликовать</button>
              </>
            ) : null}
            {course.status === "published" && canReview ? (
              <button className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-line px-4 text-sm font-black text-graphite hover:border-warning" onClick={() => setPendingAction({ status: "archived", title: "Архивировать курс?", description: "Студенты больше не будут видеть курс среди активных.", confirmLabel: "Архивировать" })} type="button"><Archive aria-hidden="true" size={17} /> Архивировать</button>
            ) : null}
            {course.status === "archived" && canReview ? (
              <button className="inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-line px-4 text-sm font-black text-graphite hover:border-lingot" onClick={() => setPendingAction({ status: "draft", title: "Восстановить курс?", description: "Курс вернётся в статус черновика.", confirmLabel: "Восстановить" })} type="button"><RotateCcw aria-hidden="true" size={17} /> Восстановить</button>
            ) : null}
          </div>
        </div>
      </section>

      <CourseLifecycle status={course.status} />

      <nav aria-label="Разделы курса" className="flex gap-2 overflow-x-auto rounded-brand border-2 border-line bg-paper p-2">
        {([
          ["overview", "Обзор"],
          ["structure", "Структура"],
          ["materials", "Материалы"],
          ["settings", "Настройки"],
          ["history", "История"],
        ] as Array<[Tab, string]>).map(([value, label]) => (
          <button className={cn("min-h-10 shrink-0 rounded-brand border-2 px-4 text-sm font-black", activeTab === value ? "border-ecto bg-ecto/10 text-ecto-dark" : "border-transparent text-ash hover:bg-mist hover:text-graphite")} key={value} onClick={() => setActiveTab(value)} type="button">{label}</button>
        ))}
      </nav>

      {activeTab === "overview" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
          <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7">
            <h2 className="text-xl font-black text-navy">Информация о курсе</h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <Meta label="Преподаватель" value={teacher ? `${teacher.firstName} ${teacher.lastName}` : "—"} icon={UserRound} />
              <Meta label="Семестр" value={semester?.name ?? "—"} icon={CalendarDays} />
              <Meta label="Факультет" value={faculty?.name ?? "—"} icon={BookOpen} />
              <Meta label="Кафедра" value={department?.name ?? "—"} icon={Layers3} />
              <Meta label="Программа" value={program?.name ?? "—"} icon={Settings2} />
              <Meta label="Период" value={`${dateFormatter.format(new Date(course.startDate))} — ${dateFormatter.format(new Date(course.endDate))}`} icon={CalendarDays} />
            </dl>
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {[
                ["Модули", course.moduleCount],
                ["Темы", course.topicCount],
                ["Уроки", course.lessonCount],
                ["Материалы", course.materialCount],
              ].map(([label, value]) => (
                <div className="rounded-brand border-2 border-line bg-mist p-3 text-center" key={label}>
                  <strong className="block text-2xl font-black text-navy">{value}</strong>
                  <span className="mt-1 block text-[11px] font-bold text-ash">{label}</span>
                </div>
              ))}
            </div>
          </section>
          {readiness ? (
            <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7">
              <div className="flex items-end justify-between gap-4">
                <div><h2 className="text-xl font-black text-navy">Готовность курса</h2><p className="mt-1 text-xs text-ash">Перед отправкой на проверку</p></div>
                <strong className="text-3xl font-black text-ecto-dark">{readiness.percentage}%</strong>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-brand bg-mist"><span className="block h-full rounded-brand bg-ecto" style={{ width: `${readiness.percentage}%` }} /></div>
              <div className="mt-5 grid gap-3">
                {readiness.items.map((item) => (
                  <div className="flex items-center gap-3 text-sm font-bold" key={item.label}>
                    <span className={cn("grid size-6 place-items-center rounded-brand border-2", item.complete ? "border-ecto bg-ecto text-white" : "border-line text-ash")}>
                      {item.complete ? <Check aria-hidden="true" size={14} /> : <X aria-hidden="true" size={14} />}
                    </span>
                    <span className={item.complete ? "text-graphite" : "text-ash"}>{item.label}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {activeTab === "structure" ? (
        <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7">
          <h2 className="text-xl font-black text-navy">Структура курса</h2>
          <p className="mt-2 text-sm text-ash">Текущий состав курса по данным Course Management.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StructureStat label="Модулей" value={course.moduleCount} />
            <StructureStat label="Тем" value={course.topicCount} />
            <StructureStat label="Уроков" value={course.lessonCount} />
          </div>
          <Link className="student-pressable mt-5 inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white" to={`/courses/${course.id}/builder`}><FolderTree aria-hidden="true" size={17} /> Управлять структурой</Link>
        </section>
      ) : null}

      {activeTab === "materials" ? (
        <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><FileText aria-hidden="true" className="text-macaw-dark" /><div><h2 className="text-xl font-black text-navy">Материалы курса</h2><p className="mt-1 text-sm text-ash">В курс добавлено материалов: {course.materialCount}</p></div></div><Link className="inline-flex min-h-10 items-center justify-center rounded-brand border-2 border-ecto px-4 text-xs font-black text-ecto-dark hover:bg-ecto/10" to="/materials">Открыть все материалы</Link></div>
          {course.syllabusName ? <div className="mt-5 rounded-brand border-2 border-line p-4"><span className="text-xs font-bold text-ash">Syllabus</span><strong className="mt-1 block text-sm font-black text-graphite">{course.syllabusName}</strong></div> : <p className="mt-5 rounded-brand bg-mist p-4 text-sm text-ash">Syllabus ещё не загружен.</p>}
          <div className="mt-5 grid gap-3 md:grid-cols-2">{materials.slice(0, 6).map((material) => <Link className="rounded-brand border-2 border-line p-4 hover:border-macaw" key={material.id} to={`/courses/${course.id}/lessons/${material.lessonId}/edit`}><span className="text-[10px] font-black uppercase tracking-wider text-macaw-dark">{material.type.toUpperCase()}</span><strong className="mt-1 block truncate text-sm font-black text-graphite">{material.title}</strong><span className="mt-1 block truncate text-xs text-ash">{material.fileName ?? material.url ?? "Mock-источник"}</span></Link>)}</div>
        </section>
      ) : null}

      {activeTab === "settings" ? (
        <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7">
          <h2 className="text-xl font-black text-navy">Системная информация</h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <SystemMeta label="ID курса" value={course.id} />
            <SystemMeta label="Язык" value={course.language.toUpperCase()} />
            <SystemMeta label="Кредиты" value={String(course.credits)} />
            <SystemMeta label="Создан" value={dateFormatter.format(new Date(course.createdAt))} />
            <SystemMeta label="Обновлён" value={dateFormatter.format(new Date(course.updatedAt))} />
            <SystemMeta label="Опубликован" value={course.publishedAt ? dateFormatter.format(new Date(course.publishedAt)) : "—"} />
          </dl>
        </section>
      ) : null}

      {activeTab === "history" ? (
        <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7">
          <h2 className="text-xl font-black text-navy">История действий</h2>
          <div className="mt-5 grid gap-4">
            {history.map((event) => {
              const actor = mockStaffUsers.find((user) => user.id === event.userId);
              return (
                <article className="grid gap-2 border-l-4 border-lingot pl-4 sm:grid-cols-[1fr_auto]" key={event.id}>
                  <div><strong className="text-sm font-black text-graphite">{event.action}</strong>{event.details ? <p className="mt-1 text-xs leading-5 text-ash">{event.details}</p> : null}<span className="mt-1 block text-xs text-ash">{actor ? `${actor.firstName} ${actor.lastName}` : "Пользователь"}</span></div>
                  <time className="text-xs font-bold text-ash">{dateFormatter.format(new Date(event.createdAt))}</time>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <CourseReviewIssuesDialog courseId={course.id} issues={reviewIssues} onClose={() => setReviewIssues([])} />

      <ConfirmDialog
        confirmLabel="Создать копию"
        description="Метаданные, структура и материалы будут перенесены в новый курс со статусом «Черновик». История и данные студентов не копируются."
        isOpen={isCopyPending}
        onCancel={() => setIsCopyPending(false)}
        onConfirm={confirmCourseCopy}
        title="Копировать курс?"
      />

      <ConfirmDialog
        confirmLabel="Продолжить редактирование"
        description="Изменения опубликованного курса могут потребовать повторной проверки перед обновлением материалов для студентов."
        isOpen={isPublishedEditPending}
        onCancel={() => setIsPublishedEditPending(false)}
        onConfirm={() => historyNavigation.push(`/courses/${course.id}/edit`)}
        title="Редактировать опубликованный курс?"
      />

      <ConfirmDialog confirmLabel={pendingAction?.confirmLabel ?? "Продолжить"} description={pendingAction?.description ?? ""} isOpen={Boolean(pendingAction)} onCancel={() => setPendingAction(null)} onConfirm={confirmStatusChange} title={pendingAction?.title ?? "Подтвердите действие"} />

      {isReturnOpen ? (
        <div aria-labelledby="return-course-title" aria-modal="true" className="fixed inset-0 z-[110] grid place-items-center bg-midnight/70 p-4" role="dialog">
          <div className="w-full max-w-lg rounded-brand border-2 border-line bg-paper p-5">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black text-navy" id="return-course-title">Вернуть курс на доработку</h2><p className="mt-2 text-sm text-ash">Укажите понятную причину возврата для преподавателя.</p></div><button aria-label="Закрыть" className="grid size-9 place-items-center rounded-brand border-2 border-line text-ash" onClick={() => setIsReturnOpen(false)} type="button"><X aria-hidden="true" size={17} /></button></div>
            <label className="mt-5 grid gap-2 text-xs font-black uppercase tracking-wider text-ash">Причина возврата<textarea autoFocus className="min-h-32 rounded-brand border-2 border-line p-3 text-sm font-bold normal-case tracking-normal text-graphite outline-none focus:border-macaw" onChange={(event) => setReturnComment(event.target.value)} placeholder="Например, добавьте материалы в Module 2" value={returnComment} /></label>
            <div className="mt-5 grid grid-cols-2 gap-3"><button className="min-h-11 rounded-brand border-2 border-line text-sm font-black text-graphite" onClick={() => setIsReturnOpen(false)} type="button">Отмена</button><button className="student-pressable min-h-11 rounded-brand border-2 border-warning bg-warning px-4 text-sm font-black text-midnight disabled:opacity-50" disabled={!returnComment.trim()} onClick={returnForRevision} type="button">Вернуть</button></div>
          </div>
        </div>
      ) : null}

      <StaffToast message={toast} onClose={closeToast} />
    </div>
  );
}

interface MetaProps {
  icon: typeof UserRound;
  label: string;
  value: string;
}

function Meta({ icon: Icon, label, value }: MetaProps) {
  return <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-brand bg-mist text-macaw-dark"><Icon aria-hidden="true" size={19} /></span><div><dt className="text-[10px] font-black uppercase tracking-wider text-ash">{label}</dt><dd className="mt-1 text-sm font-black text-graphite">{value}</dd></div></div>;
}

function StructureStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-brand border-2 border-line bg-mist p-5 text-center"><strong className="text-3xl font-black text-navy">{value}</strong><span className="mt-1 block text-xs font-bold text-ash">{label}</span></div>;
}

function SystemMeta({ label, value }: { label: string; value: string }) {
  return <div className="rounded-brand border-2 border-line p-4"><dt className="text-[10px] font-black uppercase tracking-wider text-ash">{label}</dt><dd className="mt-1 break-all font-black text-graphite">{value}</dd></div>;
}
