import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpenText, Eye, FileText, Save } from "lucide-react";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import { courseKeys } from "../../api/courseKeys";
import { coursesApi } from "../../api/courses.api";
import { learningApi } from "../../api/learning.api";
import type { LessonDetailDto, LessonType, LessonWritePayload, ReleaseType } from "../../api/learning.api";
import { learningKeys } from "../../api/learningKeys";
import { queryClient } from "../../api/queryClient";
import { useAuth } from "../../auth/useAuth";
import ApiMaterialManager from "../../components/staff/ApiMaterialManager";
import PublishedCourseNotice from "../../components/staff/PublishedCourseNotice";
import ScormManager from "../../components/staff/ScormManager";
import StaffToast from "../../components/staff/StaffToast";
import type { ToastMessage } from "../../components/staff/StaffToast";
import StatePanel from "../../components/student/StatePanel";

interface RouteParams { courseId: string; lessonId: string; }
const globalEditorRoles = new Set(["content_manager", "lms_admin", "super_admin"]);
const lessonTypeLabels: Record<LessonType, string> = { text: "Текст", video: "Видео", material: "Материал", mixed: "Смешанный", external_link: "Внешняя ссылка" };

export default function LessonEditorPage() {
  const { courseId, lessonId } = useParams<RouteParams>();
  const numericCourseId = Number(courseId);
  const numericLessonId = Number(lessonId);
  const { can, user } = useAuth();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const enabled = Number.isInteger(numericCourseId) && numericCourseId > 0 && Number.isInteger(numericLessonId) && numericLessonId > 0;
  const courseQuery = useQuery({ queryKey: courseKeys.detail(numericCourseId), queryFn: () => coursesApi.detail(numericCourseId), enabled });
  const structureQuery = useQuery({ queryKey: learningKeys.structure(numericCourseId), queryFn: () => learningApi.structure(numericCourseId), enabled });
  const lessonQuery = useQuery({ queryKey: learningKeys.lesson(numericLessonId), queryFn: () => learningApi.lesson(numericLessonId), enabled });
  const materialsQuery = useQuery({ queryKey: learningKeys.materials(numericLessonId), queryFn: () => learningApi.lessonMaterials(numericLessonId), enabled });
  const scormQuery = useQuery({ queryKey: learningKeys.scorm(numericLessonId), queryFn: () => learningApi.scormPackages(numericLessonId), enabled });
  const course = courseQuery.data;
  const structure = structureQuery.data;
  const lesson = lessonQuery.data;
  const hasGlobalEditScope = user?.roles.some((role) => globalEditorRoles.has(role)) ?? false;
  const editable = Boolean(course && can("course_structure.manage") && course.status !== "archived" && (hasGlobalEditScope || course.status === "draft" || course.status === "needs_revision"));

  const saveMutation = useMutation({
    mutationFn: (payload: LessonWritePayload) => learningApi.updateLesson(numericLessonId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: learningKeys.lesson(numericLessonId) }),
        queryClient.invalidateQueries({ queryKey: learningKeys.structure(numericCourseId) }),
        queryClient.invalidateQueries({ queryKey: courseKeys.readiness(numericCourseId) }),
        queryClient.invalidateQueries({ queryKey: courseKeys.history(numericCourseId) }),
      ]);
      setToast({ id: Date.now(), title: "Урок сохранён", description: "Backend обновил контент и настройки." });
    },
  });

  const refreshMaterials = async (message: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: learningKeys.materials(numericLessonId) }),
      queryClient.invalidateQueries({ queryKey: learningKeys.courseMaterialLists(numericCourseId) }),
      queryClient.invalidateQueries({ queryKey: courseKeys.readiness(numericCourseId) }),
      queryClient.invalidateQueries({ queryKey: courseKeys.history(numericCourseId) }),
    ]);
    setToast({ id: Date.now(), title: message });
  };

  const refreshScorm = async (message: string) => {
    await queryClient.invalidateQueries({ queryKey: learningKeys.scorm(numericLessonId) });
    setToast({ id: Date.now(), title: message });
  };

  if (!enabled) return <StatePanel description="Идентификаторы курса и урока должны быть положительными числами." kind="error" title="Некорректный адрес урока" />;
  if (courseQuery.isPending || structureQuery.isPending || lessonQuery.isPending) return <StatePanel description="Параллельно загружаем курс, структуру, урок и материалы." kind="loading" title="Загрузка Lesson Editor" />;
  const queryError = courseQuery.error ?? structureQuery.error ?? lessonQuery.error;
  if (queryError || !course || !structure || !lesson) return <StatePanel action={<Link className="mt-2 text-sm font-black text-macaw-dark hover:underline" to={`/courses/${numericCourseId}/builder`}>Вернуться в Course Builder</Link>} description={queryError?.message ?? "Урок не найден."} kind="error" title="Lesson Editor недоступен" />;
  const context = findLessonContext(structure.modules, lesson.id);
  if (!context) return <StatePanel action={<Link className="mt-2 text-sm font-black text-macaw-dark hover:underline" to={`/courses/${numericCourseId}/builder`}>Вернуться в Course Builder</Link>} description="Урок не принадлежит структуре указанного курса." kind="error" title="Несовпадение структуры" />;

  const allLessons = structure.modules.flatMap((module) => module.topics.flatMap((topic) => topic.lessons));
  return (
    <div className="grid gap-6">
      <header>
        <Link className="inline-flex items-center gap-2 text-sm font-black text-ash hover:text-macaw-dark" to={`/courses/${course.id}/builder`}><ArrowLeft aria-hidden="true" size={17} /> Назад в Course Builder</Link>
        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Lesson Editor</span><h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">{lesson.title}</h1><p className="mt-2 text-sm text-ash">{course.code} · {context.moduleTitle} · {context.topicTitle}</p></div><div className="flex flex-wrap gap-2"><span className="rounded-brand border-2 border-line bg-paper px-3 py-2 text-xs font-black text-ash">{materialsQuery.data?.length ?? 0} материалов</span><span className={`rounded-brand px-3 py-2 text-xs font-black ${lesson.is_published ? "bg-ecto/15 text-ecto-dark" : "bg-warning/15 text-warning-dark"}`}>{lesson.is_published ? "Опубликован" : "Черновик"}</span></div></div>
      </header>

      {course.status === "published" && editable ? <PublishedCourseNotice /> : null}
      {!editable ? <div className="rounded-brand border-2 border-warning/40 bg-warning/10 p-4 text-sm font-bold text-warning-dark">Урок доступен только для чтения в текущем статусе курса.</div> : null}
      <LessonForm key={lesson.updated_at} allLessons={allLessons} editable={editable} error={saveMutation.error?.message} isPending={saveMutation.isPending} lesson={lesson} onSave={(payload) => saveMutation.mutate(payload)} />
      <ApiMaterialManager editable={editable} error={materialsQuery.error?.message} isLoading={materialsQuery.isPending} lessonId={lesson.id} materials={materialsQuery.data ?? []} onChanged={refreshMaterials} />
      <ScormManager editable={editable} error={scormQuery.error?.message} isLoading={scormQuery.isPending} lessonId={lesson.id} onChanged={refreshScorm} packages={scormQuery.data ?? []} />
      <StaffToast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function LessonForm({ allLessons, editable, error, isPending, lesson, onSave }: { allLessons: Array<{ id: number; title: string }>; editable: boolean; error?: string; isPending: boolean; lesson: LessonDetailDto; onSave: (payload: LessonWritePayload) => void }) {
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description);
  const [lessonType, setLessonType] = useState(lesson.lesson_type);
  const [content, setContent] = useState(lesson.content);
  const [duration, setDuration] = useState(lesson.estimated_duration_minutes ? String(lesson.estimated_duration_minutes) : "");
  const [releaseType, setReleaseType] = useState<ReleaseType>(lesson.release_type);
  const [releaseAt, setReleaseAt] = useState((lesson.release_at ?? "").slice(0, 16));
  const [requiredLesson, setRequiredLesson] = useState(lesson.required_lesson ? String(lesson.required_lesson) : "");
  const [isPublished, setIsPublished] = useState(lesson.is_published);
  const [isPreview, setIsPreview] = useState(false);
  const durationNumber = duration ? Number(duration) : null;
  const isInvalid = !title.trim() || (durationNumber !== null && (!Number.isFinite(durationNumber) || durationNumber < 1)) || (releaseType === "date" && !releaseAt) || (releaseType === "after_lesson" && !requiredLesson);
  const submit = () => onSave({
    title: title.trim(),
    description: description.trim(),
    lesson_type: lessonType,
    content,
    estimated_duration_minutes: durationNumber,
    release_type: releaseType,
    release_at: releaseType === "date" ? new Date(releaseAt).toISOString() : null,
    required_lesson: releaseType === "after_lesson" ? Number(requiredLesson) : null,
    is_published: isPublished,
  });

  return (
    <section className="rounded-brand border-2 border-line bg-paper p-4 sm:p-6">
      <fieldset className="grid gap-6" disabled={!editable || isPending}>
        <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-brand bg-eel/40 text-ecto-dark"><BookOpenText aria-hidden="true" size={21} /></span><div><h2 className="text-xl font-black text-navy">Контент и настройки</h2><p className="mt-1 text-xs text-ash">Все поля соответствуют backend LessonWriteSerializer.</p></div></div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><Field className="sm:col-span-2" label="Название" required><input className={inputClasses} maxLength={255} onChange={(event) => setTitle(event.target.value)} value={title} /></Field><Field label="Тип урока"><select className={inputClasses} onChange={(event) => setLessonType(event.target.value as LessonType)} value={lessonType}>{(Object.entries(lessonTypeLabels) as Array<[LessonType, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field className="sm:col-span-2 xl:col-span-3" label="Описание"><textarea className={`${inputClasses} min-h-24 py-3`} onChange={(event) => setDescription(event.target.value)} value={description} /></Field><Field label="Длительность, мин"><input className={inputClasses} min="1" onChange={(event) => setDuration(event.target.value)} type="number" value={duration} /></Field><Field label="Условие открытия"><select className={inputClasses} onChange={(event) => setReleaseType(event.target.value as ReleaseType)} value={releaseType}><option value="always">Всегда доступен</option><option value="after_previous">После предыдущего</option><option value="after_lesson">После выбранного урока</option><option value="date">По дате</option></select></Field>{releaseType === "date" ? <Field label="Дата открытия" required><input className={inputClasses} onChange={(event) => setReleaseAt(event.target.value)} type="datetime-local" value={releaseAt} /></Field> : null}{releaseType === "after_lesson" ? <Field label="Обязательный урок" required><select className={inputClasses} onChange={(event) => setRequiredLesson(event.target.value)} value={requiredLesson}><option value="">Выберите урок</option>{allLessons.filter((item) => item.id !== lesson.id).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field> : null}<label className="flex min-h-12 items-center gap-3 self-end rounded-brand border-2 border-line px-4 text-sm font-black text-graphite"><input checked={isPublished} className="size-5 accent-[#27a8e0]" onChange={(event) => setIsPublished(event.target.checked)} type="checkbox" /> Показывать в опубликованной структуре</label></div>
        <div><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><FileText aria-hidden="true" className="text-macaw-dark" size={21} /><div><h3 className="font-black text-navy">Учебный контент</h3><p className="mt-1 text-xs text-ash">Markdown сохраняется в поле content.</p></div></div><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-brand border-2 border-line px-4 text-xs font-black text-graphite" onClick={() => setIsPreview((current) => !current)} type="button"><Eye aria-hidden="true" size={16} /> {isPreview ? "Редактор" : "Предпросмотр"}</button></div>{isPreview ? <div className="prose prose-sm mt-4 min-h-64 max-w-none rounded-brand border-2 border-line bg-mist p-5 text-graphite"><ReactMarkdown>{content || "Контент урока пока не заполнен."}</ReactMarkdown></div> : <textarea aria-label="Контент урока" className="mt-4 min-h-72 w-full resize-y rounded-brand border-2 border-line bg-paper p-4 font-mono text-sm leading-6 text-graphite outline-none focus:border-macaw" onChange={(event) => setContent(event.target.value)} value={content} />}</div>
      </fieldset>
      {error ? <p className="mt-5 rounded-brand border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{error}</p> : null}
      {editable ? <div className="mt-5 flex justify-end"><button className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white disabled:opacity-50" disabled={isInvalid || isPending} onClick={submit} type="button"><Save aria-hidden="true" size={18} /> {isPending ? "Сохранение…" : "Сохранить урок"}</button></div> : null}
    </section>
  );
}

const inputClasses = "min-h-12 w-full rounded-brand border-2 border-line bg-paper px-3 text-sm font-bold text-graphite outline-none focus:border-macaw disabled:bg-mist disabled:text-ash";
function Field({ children, className, label, required = false }: { children: React.ReactNode; className?: string; label: string; required?: boolean }) { return <label className={`grid content-start gap-2 ${className ?? ""}`}><span className="text-xs font-black uppercase tracking-wider text-ash">{label}{required ? <span className="ml-1 text-danger">*</span> : null}</span>{children}</label>; }
function findLessonContext(modules: Array<{ title: string; topics: Array<{ title: string; lessons: Array<{ id: number }> }> }>, lessonId: number): { moduleTitle: string; topicTitle: string } | null { for (const module of modules) { for (const topic of module.topics) { if (topic.lessons.some((item) => item.id === lessonId)) return { moduleTitle: module.title, topicTitle: topic.title }; } } return null; }
