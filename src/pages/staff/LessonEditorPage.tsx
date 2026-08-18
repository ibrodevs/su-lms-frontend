import { ArrowLeft, BookOpenText, Eye, FileText, Save, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useHistory, useParams } from "react-router-dom";
import MaterialManager from "../../components/staff/MaterialManager";
import StaffToast from "../../components/staff/StaffToast";
import type { ToastMessage } from "../../components/staff/StaffToast";
import PublishedCourseNotice from "../../components/staff/PublishedCourseNotice";
import ConfirmDialog from "../../components/student/ConfirmDialog";
import { getCourse, subscribeCourseStore } from "../../services/courseService";
import { getCourseStructure, getLesson, updateLesson } from "../../services/courseStructureService";
import { getMaterialsForLesson } from "../../services/materialService";
import { useLegacyStaffSession } from "../../auth/useLegacyStaffSession";
import { canStaffUserAccessCourse } from "../../services/staffAuthorization";
import type { LessonInput, LessonStatus, LessonType, LessonVideoKind, ReleaseConditionType } from "../../types/staff";
import { cn } from "../../utils/cn";

interface RouteParams {
  courseId: string;
  lessonId: string;
}

const lessonTypeLabels: Record<LessonType, string> = {
  text: "Текст",
  video: "Видео",
  material: "Материалы",
  mixed: "Смешанный",
  "external-link": "Внешняя ссылка",
};

function inputClasses(error?: string): string {
  return `min-h-12 w-full rounded-brand border-2 bg-paper px-3 text-sm font-bold text-graphite outline-none ${error ? "border-danger" : "border-line focus:border-macaw"}`;
}

function Field({ children, error, label, required = false }: { children: React.ReactNode; error?: string; label: string; required?: boolean }) {
  return <label className="grid content-start gap-2"><span className="text-xs font-black uppercase tracking-wider text-ash">{label}{required ? <span className="ml-1 text-danger">*</span> : null}</span>{children}{error ? <span className="text-xs font-bold text-danger">{error}</span> : null}</label>;
}

export default function LessonEditorPage() {
  const { courseId, lessonId } = useParams<RouteParams>();
  const history = useHistory();
  const session = useLegacyStaffSession();
  const [revision, setRevision] = useState(0);
  const course = useMemo(() => revision >= 0 ? getCourse(courseId) : null, [courseId, revision]);
  const lesson = useMemo(() => revision >= 0 ? getLesson(lessonId) : null, [lessonId, revision]);
  const structure = useMemo(() => revision >= 0 ? getCourseStructure(courseId) : { modules: [], topics: [], lessons: [] }, [courseId, revision]);
  const topic = lesson ? structure.topics.find((candidate) => candidate.id === lesson.topicId) : undefined;
  const module = topic ? structure.modules.find((candidate) => candidate.id === topic.moduleId) : undefined;
  const materials = useMemo(() => revision >= 0 ? getMaterialsForLesson(lessonId) : [], [lessonId, revision]);
  const [form, setForm] = useState<LessonInput | null>(null);
  const [errors, setErrors] = useState<{ title?: string; duration?: string; videoUrl?: string }>({});
  const [isDirty, setIsDirty] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isContentPreview, setIsContentPreview] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const allowNavigationRef = useRef(false);
  const closeToast = useCallback(() => setToast(null), []);
  const hasAccess = Boolean(course && session && canStaffUserAccessCourse(course, session.userId));

  useEffect(() => subscribeCourseStore(() => setRevision((value) => value + 1)), []);

  useEffect(() => {
    if (!lesson) return;
    setForm({
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      durationMinutes: lesson.durationMinutes,
      available: lesson.available,
      releaseCondition: { ...lesson.releaseCondition },
      status: lesson.status,
      content: lesson.content,
      videoKind: lesson.videoKind,
      videoUrl: lesson.videoUrl,
      videoTitle: lesson.videoTitle,
      videoDescription: lesson.videoDescription,
    });
    setIsDirty(false);
  }, [lesson]);

  useEffect(() => {
    if (!isDirty) return;
    const unblock = history.block((location) => {
      if (allowNavigationRef.current) return undefined;
      setPendingPath(`${location.pathname}${location.search}${location.hash}`);
      return false;
    });
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => { unblock(); window.removeEventListener("beforeunload", beforeUnload); };
  }, [history, isDirty]);

  const otherLessons = useMemo(() => structure.lessons.filter((candidate) => candidate.id !== lessonId), [lessonId, structure.lessons]);

  if (!course || !lesson || !session || !hasAccess || !form || !topic || !module) {
    return <div className="grid min-h-96 place-items-center rounded-brand border-2 border-line p-6 text-center"><div><h1 className="text-2xl font-black text-navy">{course && !hasAccess ? "Нет доступа к уроку" : "Урок не найден"}</h1><Link className="mt-4 inline-block text-sm font-black text-macaw-dark hover:underline" to={course && hasAccess ? `/courses/${course.id}/builder` : "/courses"}>Вернуться к курсам</Link></div></div>;
  }

  const updateField = <Key extends keyof LessonInput>(key: Key, value: LessonInput[Key]) => {
    setForm((current) => current ? { ...current, [key]: value } : current);
    setIsDirty(true);
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const saveLesson = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!form.title.trim()) nextErrors.title = "Введите название урока.";
    if (!Number.isFinite(form.durationMinutes) || form.durationMinutes < 1 || form.durationMinutes > 600) nextErrors.duration = "Укажите от 1 до 600 минут.";
    if (form.videoKind === "youtube" && !form.videoUrl?.trim()) nextErrors.videoUrl = "Добавьте YouTube-ссылку.";
    else if (form.videoKind === "youtube" && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(form.videoUrl ?? "")) nextErrors.videoUrl = "Используйте корректную YouTube-ссылку.";
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); setToast({ id: Date.now(), title: "Проверьте поля урока", variant: "error" }); return; }
    updateLesson(lesson.id, form, session.userId);
    setIsDirty(false);
    setToast({ id: Date.now(), title: "Урок сохранён", description: "Контент и настройки обновлены." });
  };

  const handleMaterialsChanged = (message: string) => setToast({ id: Date.now(), title: message });

  const leaveWithoutSaving = () => {
    if (!pendingPath) return;
    allowNavigationRef.current = true;
    history.push(pendingPath);
  };

  const updateReleaseType = (type: ReleaseConditionType) => {
    if (type === "after-lesson") updateField("releaseCondition", { type, afterLessonId: otherLessons[0]?.id });
    else if (type === "date") updateField("releaseCondition", { type, availableFrom: new Date().toISOString().slice(0, 10) });
    else updateField("releaseCondition", { type });
  };

  return (
    <div className="grid gap-6">
      <header>
        <Link className="inline-flex items-center gap-2 text-sm font-black text-ash hover:text-macaw-dark" to={`/courses/${course.id}/builder`}><ArrowLeft aria-hidden="true" size={17} /> Назад в Course Builder</Link>
        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Lesson Editor</span><h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">{lesson.title}</h1><p className="mt-2 text-sm text-ash">{course.code} · {module.title} · {topic.title}</p></div><div className="flex flex-wrap gap-2"><span className="rounded-brand border-2 border-line bg-paper px-3 py-2 text-xs font-black text-ash">{materials.length} материалов</span><span className={cn("rounded-brand px-3 py-2 text-xs font-black", lesson.status === "ready" ? "bg-ecto/15 text-ecto-dark" : "bg-warning/15 text-warning-dark")}>{lesson.status === "ready" ? "Готов" : "Черновик"}</span></div></div>
      </header>

      {course.status === "published" ? <PublishedCourseNotice /> : null}

      <form className="grid gap-6" noValidate onSubmit={saveLesson}>
        <section className="rounded-brand border-2 border-line bg-paper p-4 sm:p-6">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-brand bg-eel/40 text-ecto-dark"><BookOpenText aria-hidden="true" size={21} /></span><div><h2 className="text-xl font-black text-navy">Основные настройки</h2><p className="mt-1 text-xs text-ash">Метаданные, статус и доступность урока.</p></div></div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div className="sm:col-span-2 xl:col-span-2"><Field error={errors.title} label="Название урока" required><input className={inputClasses(errors.title)} onChange={(event) => updateField("title", event.target.value)} value={form.title} /></Field></div>
            <Field label="Тип урока"><select className={inputClasses()} onChange={(event) => updateField("type", event.target.value as LessonType)} value={form.type}>{(Object.entries(lessonTypeLabels) as Array<[LessonType, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <div className="sm:col-span-2 xl:col-span-3"><Field label="Описание"><textarea className={`${inputClasses()} min-h-24 resize-y py-3`} onChange={(event) => updateField("description", event.target.value)} value={form.description} /></Field></div>
            <Field error={errors.duration} label="Длительность, мин"><input className={inputClasses(errors.duration)} max="600" min="1" onChange={(event) => updateField("durationMinutes", Number(event.target.value))} type="number" value={form.durationMinutes} /></Field>
            <Field label="Статус"><select className={inputClasses()} onChange={(event) => updateField("status", event.target.value as LessonStatus)} value={form.status}><option value="draft">Черновик</option><option value="ready">Готов</option></select></Field>
            <label className="flex min-h-12 items-center gap-3 self-end rounded-brand border-2 border-line px-4 text-sm font-black text-graphite"><input checked={form.available} className="size-5 accent-[#27a8e0]" onChange={(event) => updateField("available", event.target.checked)} type="checkbox" /> Показывать студентам</label>
          </div>
        </section>

        <section className="rounded-brand border-2 border-line bg-paper p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-brand bg-macaw/10 text-macaw-dark"><FileText aria-hidden="true" size={21} /></span><div><h2 className="text-xl font-black text-navy">Учебный контент</h2><p className="mt-1 text-xs text-ash">Markdown-разметка для текста урока.</p></div></div><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-brand border-2 border-line px-4 text-xs font-black text-graphite hover:bg-mist" onClick={() => setIsContentPreview((current) => !current)} type="button"><Eye aria-hidden="true" size={16} /> {isContentPreview ? "Вернуться к редактору" : "Предпросмотр"}</button></div>
          {isContentPreview ? <div className="prose prose-sm mt-5 max-w-none rounded-brand border-2 border-line bg-mist p-5 text-graphite"><ReactMarkdown>{form.content || "Контент урока пока не заполнен."}</ReactMarkdown></div> : <textarea aria-label="Контент урока" className="mt-5 min-h-72 w-full resize-y rounded-brand border-2 border-line bg-paper p-4 font-mono text-sm leading-6 text-graphite outline-none focus:border-macaw" onChange={(event) => updateField("content", event.target.value)} placeholder="## Заголовок урока\n\nОсновной текст..." value={form.content} />}
        </section>

        <section className="rounded-brand border-2 border-line bg-paper p-4 sm:p-6">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-brand bg-warning/15 text-warning-dark"><Video aria-hidden="true" size={21} /></span><div><h2 className="text-xl font-black text-navy">Видео урока</h2><p className="mt-1 text-xs text-ash">YouTube embed либо статичный video-placeholder.</p></div></div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Источник видео"><select className={inputClasses()} onChange={(event) => updateField("videoKind", event.target.value as LessonVideoKind)} value={form.videoKind}><option value="none">Без видео</option><option value="youtube">YouTube</option><option value="placeholder">Video-placeholder</option></select></Field>
            {form.videoKind !== "none" ? <Field label="Название видео"><input className={inputClasses()} onChange={(event) => updateField("videoTitle", event.target.value)} placeholder="Введение в тему" value={form.videoTitle ?? ""} /></Field> : null}
            {form.videoKind === "youtube" ? <div className="sm:col-span-2"><Field error={errors.videoUrl} label="YouTube URL"><input className={inputClasses(errors.videoUrl)} onChange={(event) => updateField("videoUrl", event.target.value)} placeholder="https://www.youtube.com/embed/..." type="url" value={form.videoUrl ?? ""} /></Field></div> : null}
            {form.videoKind !== "none" ? <div className="sm:col-span-2"><Field label="Описание видео"><textarea className={`${inputClasses()} min-h-20 resize-y py-3`} onChange={(event) => updateField("videoDescription", event.target.value)} value={form.videoDescription ?? ""} /></Field></div> : null}
          </div>
          {form.videoKind === "youtube" && form.videoUrl ? <div className="mt-5 aspect-video overflow-hidden rounded-brand border-2 border-line bg-midnight"><iframe allowFullScreen className="size-full" src={form.videoUrl} title={form.videoTitle || "Видео урока"} /></div> : null}
          {form.videoKind === "placeholder" ? <div className="mt-5 grid aspect-video max-h-96 place-items-center rounded-brand border-2 border-dashed border-line bg-midnight text-center text-white"><div><Video aria-hidden="true" className="mx-auto" size={42} /><strong className="mt-3 block text-lg font-black">{form.videoTitle || "Видео будет добавлено позже"}</strong><p className="mt-2 text-sm text-white/70">{form.videoDescription || "Статичный placeholder видео."}</p></div></div> : null}
        </section>

        <section className="rounded-brand border-2 border-line bg-paper p-4 sm:p-6">
          <h2 className="text-xl font-black text-navy">Условия открытия</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Release Condition"><select className={inputClasses()} onChange={(event) => updateReleaseType(event.target.value as ReleaseConditionType)} value={form.releaseCondition.type}><option value="always">Всегда доступно</option><option value="after-previous">После предыдущего урока</option><option disabled={!otherLessons.length} value="after-lesson">После выбранного урока</option><option value="date">С определённой даты</option></select></Field>{form.releaseCondition.type === "after-lesson" ? <Field label="После урока"><select className={inputClasses()} onChange={(event) => updateField("releaseCondition", { type: "after-lesson", afterLessonId: event.target.value })} value={form.releaseCondition.afterLessonId ?? ""}>{otherLessons.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select></Field> : null}{form.releaseCondition.type === "date" ? <Field label="Дата открытия"><input className={inputClasses()} onChange={(event) => updateField("releaseCondition", { type: "date", availableFrom: event.target.value })} type="date" value={form.releaseCondition.availableFrom ?? ""} /></Field> : null}</div>
        </section>

        <div className="sticky bottom-3 z-20 flex flex-col-reverse gap-3 rounded-brand border-2 border-line bg-paper/95 p-3 backdrop-blur sm:flex-row sm:justify-end"><Link className="inline-flex min-h-12 items-center justify-center rounded-brand border-2 border-line px-5 text-sm font-black text-graphite hover:bg-mist" to={`/courses/${course.id}/builder`}>Отмена</Link><button className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white" type="submit"><Save aria-hidden="true" size={18} /> Сохранить урок</button></div>
      </form>

      <MaterialManager lessonId={lesson.id} materials={materials} onChanged={handleMaterialsChanged} userId={session.userId} />
      <ConfirmDialog confirmLabel="Выйти" description="Все несохранённые изменения контента урока будут потеряны." isOpen={Boolean(pendingPath)} onCancel={() => setPendingPath(null)} onConfirm={leaveWithoutSaving} title="У вас есть несохранённые изменения" />
      <StaffToast message={toast} onClose={closeToast} />
    </div>
  );
}
