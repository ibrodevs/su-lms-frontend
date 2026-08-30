import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpenText,
  Edit3,
  FileText,
  FolderTree,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { courseKeys } from "../../api/courseKeys";
import { coursesApi } from "../../api/courses.api";
import { learningApi } from "../../api/learning.api";
import type { ReorderItem, StructureEntityType } from "../../api/learning.api";
import { learningKeys } from "../../api/learningKeys";
import { queryClient } from "../../api/queryClient";
import { useAuth } from "../../auth/useAuth";
import ApiCourseStatusBadge from "../../components/staff/ApiCourseStatusBadge";
import PublishedCourseNotice from "../../components/staff/PublishedCourseNotice";
import StaffToast from "../../components/staff/StaffToast";
import type { ToastMessage } from "../../components/staff/StaffToast";
import StructureEntityDialog from "../../components/staff/StructureEntityDialog";
import type { StructureEditorTarget, StructureSaveRequest } from "../../components/staff/StructureEntityDialog";
import ConfirmDialog from "../../components/student/ConfirmDialog";
import StatePanel from "../../components/student/StatePanel";

interface RouteParams { courseId: string; }
interface PendingDelete { id: number; kind: StructureEntityType; title: string; }

const globalEditorRoles = new Set(["content_manager", "lms_admin", "super_admin"]);
const lessonTypeLabels = {
  text: "Текст",
  video: "Видео",
  material: "Материал",
  mixed: "Смешанный",
  external_link: "Внешняя ссылка",
} as const;
const releaseLabels = {
  always: "Всегда",
  after_previous: "После предыдущего",
  after_lesson: "После урока",
  date: "По дате",
} as const;

export default function CourseBuilderPage() {
  const { courseId } = useParams<RouteParams>();
  const numericCourseId = Number(courseId);
  const { can, user } = useAuth();
  const [editor, setEditor] = useState<StructureEditorTarget | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const enabled = Number.isInteger(numericCourseId) && numericCourseId > 0;
  const courseQuery = useQuery({ queryKey: courseKeys.detail(numericCourseId), queryFn: () => coursesApi.detail(numericCourseId), enabled });
  const structureQuery = useQuery({ queryKey: learningKeys.structure(numericCourseId), queryFn: () => learningApi.structure(numericCourseId), enabled });
  const structure = structureQuery.data;
  const lessons = useMemo(() => structure?.modules.flatMap((module) => module.topics.flatMap((topic) => topic.lessons)) ?? [], [structure]);
  const topicCount = structure?.modules.reduce((count, module) => count + module.topics.length, 0) ?? 0;
  const hasGlobalEditScope = user?.roles.some((role) => globalEditorRoles.has(role)) ?? false;
  const course = courseQuery.data;
  const canEdit = Boolean(course && can("course_structure.manage") && course.status !== "archived" && (hasGlobalEditScope || course.status === "draft" || course.status === "needs_revision"));

  const refreshStructure = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: learningKeys.structure(numericCourseId) }),
      queryClient.invalidateQueries({ queryKey: courseKeys.readiness(numericCourseId) }),
      queryClient.invalidateQueries({ queryKey: courseKeys.history(numericCourseId) }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async (request: StructureSaveRequest) => {
      if (request.kind === "module") return request.entityId ? learningApi.updateModule(request.entityId, request.payload) : learningApi.createModule(request.parentId, request.payload);
      if (request.kind === "topic") return request.entityId ? learningApi.updateTopic(request.entityId, request.payload) : learningApi.createTopic(request.parentId, request.payload);
      return request.entityId ? learningApi.updateLesson(request.entityId, request.payload) : learningApi.createLesson(request.parentId, request.payload);
    },
    onSuccess: async () => {
      await refreshStructure();
      setEditor(null);
      setToast({ id: Date.now(), title: "Структура курса сохранена" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (target: PendingDelete) => {
      if (target.kind === "module") return learningApi.deleteModule(target.id);
      if (target.kind === "topic") return learningApi.deleteTopic(target.id);
      return learningApi.deleteLesson(target.id);
    },
    onSuccess: async () => {
      await refreshStructure();
      setToast({ id: Date.now(), title: "Элемент структуры удалён" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ type, items }: { type: StructureEntityType; items: ReorderItem[] }) => learningApi.reorder(numericCourseId, type, items),
    onSuccess: async () => {
      await refreshStructure();
      setToast({ id: Date.now(), title: "Порядок элементов обновлён" });
    },
  });

  const move = (type: StructureEntityType, siblings: Array<{ id: number }>, id: number, direction: -1 | 1) => {
    const currentIndex = siblings.findIndex((item) => item.id === id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= siblings.length) return;
    const reordered = [...siblings];
    const currentItem = reordered[currentIndex];
    const targetItem = reordered[targetIndex];
    if (!currentItem || !targetItem) return;
    reordered[currentIndex] = targetItem;
    reordered[targetIndex] = currentItem;
    reorderMutation.mutate({ type, items: reordered.map((item, index) => ({ id: item.id, order: index + 1 })) });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    deleteMutation.mutate(target);
  };

  if (!enabled) return <StatePanel description="Идентификатор курса должен быть положительным числом." kind="error" title="Некорректный адрес курса" />;
  if (courseQuery.isPending || structureQuery.isPending) return <StatePanel description="Получаем актуальное дерево курса с сервера." kind="loading" title="Загрузка Course Builder" />;
  const queryError = courseQuery.error ?? structureQuery.error;
  if (queryError || !course || !structure) return <StatePanel action={<Link className="mt-2 text-sm font-black text-macaw-dark hover:underline" to="/courses">Вернуться к курсам</Link>} description={queryError?.message ?? "Структура курса не найдена."} kind="error" title="Course Builder недоступен" />;

  const mutationError = saveMutation.error ?? deleteMutation.error ?? reorderMutation.error;
  const isMutating = saveMutation.isPending || deleteMutation.isPending || reorderMutation.isPending;

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Link className="inline-flex items-center gap-2 text-sm font-black text-ash hover:text-macaw-dark" to={`/courses/${course.id}`}><ArrowLeft aria-hidden="true" size={17} /> Назад к курсу</Link>
          <span className="mt-5 block text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Course Builder</span>
          <div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-black tracking-tight text-navy sm:text-4xl">Структура курса</h1><ApiCourseStatusBadge status={course.status} /></div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ash"><strong className="text-graphite">{course.title}</strong> · {course.code}. Изменения сохраняются непосредственно в backend.</p>
        </div>
        <div className="grid grid-cols-3 gap-2"><BuilderStat label="Модулей" value={structure.modules.length} /><BuilderStat label="Тем" value={topicCount} /><BuilderStat label="Уроков" value={lessons.length} /></div>
      </header>

      {course.status === "published" && canEdit ? <PublishedCourseNotice /> : null}
      {!canEdit ? <div className="rounded-brand border-2 border-warning/40 bg-warning/10 p-4 text-sm font-bold leading-6 text-warning-dark">Структура доступна только для чтения. Для вашей роли редактирование запрещено в текущем статусе курса.</div> : null}
      {mutationError ? <div className="rounded-brand border-2 border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800" role="alert">{mutationError.message}</div> : null}

      <section className="rounded-brand border-2 border-line bg-paper p-4 sm:p-6">
        <div className="flex flex-col gap-3 border-b-2 border-line pb-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center gap-2 text-xl font-black text-navy"><FolderTree aria-hidden="true" className="text-ecto-dark" size={22} /> Дерево курса</h2><p className="mt-1 text-xs text-ash">Порядок меняется атомарно внутри текущего уровня.</p></div>{canEdit ? <button className="student-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white" disabled={isMutating} onClick={() => setEditor({ kind: "module", parentId: course.id })} type="button"><Plus aria-hidden="true" size={17} /> Добавить модуль</button> : null}</div>

        {structure.modules.length ? <div className="mt-5 grid gap-5">{structure.modules.map((module, moduleIndex) => (
          <article className="overflow-hidden rounded-brand border-2 border-line" key={module.id}>
            <div className="flex flex-col gap-3 bg-mist p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-brand bg-ecto text-sm font-black text-white">{module.order}</span><div className="min-w-0"><h3 className="truncate text-base font-black text-navy">{module.title}</h3><p className="mt-1 text-xs font-bold text-ash">{releaseLabels[module.release_type]} · {module.topics.length} тем</p></div></div>
              {canEdit ? <div className="flex flex-wrap gap-2"><MoveButtons disabled={isMutating} isFirst={moduleIndex === 0} isLast={moduleIndex === structure.modules.length - 1} onMove={(direction) => move("module", structure.modules, module.id, direction)} /><IconButton label="Изменить модуль" onClick={() => setEditor({ kind: "module", parentId: course.id, entity: module })}><Edit3 aria-hidden="true" size={16} /></IconButton><IconButton danger label="Удалить модуль" onClick={() => setPendingDelete({ id: module.id, kind: "module", title: module.title })}><Trash2 aria-hidden="true" size={16} /></IconButton></div> : null}
            </div>

            <div className="grid gap-4 p-4">
              {module.topics.map((topic, topicIndex) => <section className="rounded-brand border-2 border-line p-3 sm:p-4" key={topic.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-brand bg-macaw/10 text-xs font-black text-macaw-dark">{module.order}.{topic.order}</span><div><h4 className="font-black text-graphite">{topic.title}</h4><p className="mt-1 text-xs text-ash">{topic.lessons.length} уроков</p></div></div>{canEdit ? <div className="flex flex-wrap gap-2"><MoveButtons disabled={isMutating} isFirst={topicIndex === 0} isLast={topicIndex === module.topics.length - 1} onMove={(direction) => move("topic", module.topics, topic.id, direction)} /><IconButton label="Изменить тему" onClick={() => setEditor({ kind: "topic", parentId: module.id, entity: topic })}><Edit3 aria-hidden="true" size={16} /></IconButton><IconButton danger label="Удалить тему" onClick={() => setPendingDelete({ id: topic.id, kind: "topic", title: topic.title })}><Trash2 aria-hidden="true" size={16} /></IconButton></div> : null}</div>
                <div className="mt-3 grid gap-2">{topic.lessons.map((lesson, lessonIndex) => <div className="flex flex-col gap-3 rounded-brand border-2 border-line bg-paper p-3 sm:flex-row sm:items-center sm:justify-between" key={lesson.id}><div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-brand bg-eel/40 text-macaw-dark"><BookOpenText aria-hidden="true" size={17} /></span><div className="min-w-0"><Link className="block truncate text-sm font-black text-graphite hover:text-macaw-dark hover:underline" to={`/courses/${course.id}/lessons/${lesson.id}/edit`}>{lesson.title}</Link><span className="mt-1 block text-[11px] font-bold text-ash">{lessonTypeLabels[lesson.lesson_type]} · {lesson.estimated_duration_minutes ?? "—"} мин · {lesson.is_published ? "Опубликован" : "Черновик"}</span></div></div>{canEdit ? <div className="flex flex-wrap gap-2"><MoveButtons disabled={isMutating} isFirst={lessonIndex === 0} isLast={lessonIndex === topic.lessons.length - 1} onMove={(direction) => move("lesson", topic.lessons, lesson.id, direction)} /><IconButton label="Изменить урок" onClick={() => setEditor({ kind: "lesson", parentId: topic.id, entity: lesson })}><Edit3 aria-hidden="true" size={16} /></IconButton><IconButton danger label="Удалить урок" onClick={() => setPendingDelete({ id: lesson.id, kind: "lesson", title: lesson.title })}><Trash2 aria-hidden="true" size={16} /></IconButton></div> : null}</div>)}</div>
                {canEdit ? <button className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-brand border-2 border-dashed border-line text-xs font-black text-ash hover:border-macaw hover:text-macaw-dark" disabled={isMutating} onClick={() => setEditor({ kind: "lesson", parentId: topic.id })} type="button"><Plus aria-hidden="true" size={15} /> Добавить урок</button> : null}
              </section>)}
              {canEdit ? <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-brand border-2 border-dashed border-line text-sm font-black text-ash hover:border-macaw hover:text-macaw-dark" disabled={isMutating} onClick={() => setEditor({ kind: "topic", parentId: module.id })} type="button"><Plus aria-hidden="true" size={16} /> Добавить тему</button> : null}
            </div>
          </article>
        ))}</div> : <div className="grid min-h-56 place-items-center text-center"><div><FileText aria-hidden="true" className="mx-auto text-ash" size={36} /><h2 className="mt-3 text-xl font-black text-navy">Структура пока пуста</h2><p className="mt-2 text-sm text-ash">Добавьте первый модуль, затем темы и уроки.</p></div></div>}
      </section>

      {editor ? <StructureEntityDialog availableLessons={lessons} error={saveMutation.error?.message} isPending={saveMutation.isPending} onCancel={() => setEditor(null)} onSubmit={(request) => saveMutation.mutate(request)} target={editor} /> : null}
      <ConfirmDialog confirmLabel="Удалить" description={pendingDelete ? `«${pendingDelete.title}» будет удалён${pendingDelete.kind === "module" ? " вместе со всеми темами, уроками и материалами" : pendingDelete.kind === "topic" ? " вместе со всеми уроками и материалами" : " вместе с материалами"}. Действие нельзя отменить.` : ""} isOpen={Boolean(pendingDelete)} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} title="Удалить элемент структуры?" />
      <StaffToast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function BuilderStat({ label, value }: { label: string; value: number }) {
  return <div className="min-w-24 rounded-brand border-2 border-line bg-paper px-3 py-2 text-center"><strong className="block text-xl font-black text-navy">{value}</strong><span className="text-[10px] font-black uppercase tracking-wider text-ash">{label}</span></div>;
}

function IconButton({ children, danger = false, label, onClick }: { children: React.ReactNode; danger?: boolean; label: string; onClick: () => void }) {
  return <button aria-label={label} className={`grid size-9 place-items-center rounded-brand border-2 ${danger ? "border-red-200 text-red-700 hover:bg-red-50" : "border-line text-ash hover:border-macaw hover:text-macaw-dark"}`} onClick={onClick} type="button">{children}</button>;
}

function MoveButtons({ disabled, isFirst, isLast, onMove }: { disabled: boolean; isFirst: boolean; isLast: boolean; onMove: (direction: -1 | 1) => void }) {
  return <><button aria-label="Переместить выше" className="grid size-9 place-items-center rounded-brand border-2 border-line text-ash disabled:opacity-30" disabled={disabled || isFirst} onClick={() => onMove(-1)} type="button"><ArrowUp aria-hidden="true" size={15} /></button><button aria-label="Переместить ниже" className="grid size-9 place-items-center rounded-brand border-2 border-line text-ash disabled:opacity-30" disabled={disabled || isLast} onClick={() => onMove(1)} type="button"><ArrowDown aria-hidden="true" size={15} /></button></>;
}
