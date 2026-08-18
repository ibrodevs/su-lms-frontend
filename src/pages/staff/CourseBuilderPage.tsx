import { ArrowLeft, Eye, Menu, PanelLeftClose, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CourseStructureTree from "../../components/staff/CourseStructureTree";
import type { StructureEntityKind, StructureSelection } from "../../components/staff/CourseStructureTree";
import StaffToast from "../../components/staff/StaffToast";
import type { ToastMessage } from "../../components/staff/StaffToast";
import PublishedCourseNotice from "../../components/staff/PublishedCourseNotice";
import StructureEditor from "../../components/staff/StructureEditor";
import ConfirmDialog from "../../components/student/ConfirmDialog";
import { getCourse, subscribeCourseStore } from "../../services/courseService";
import {
  deleteLesson,
  deleteModule,
  deleteTopic,
  duplicateLesson,
  duplicateModule,
  duplicateTopic,
  getCourseStructure,
  moveLesson,
  moveModule,
  moveTopic,
} from "../../services/courseStructureService";
import { useLegacyStaffSession } from "../../auth/useLegacyStaffSession";
import { canStaffUserAccessCourse } from "../../services/staffAuthorization";

interface RouteParams {
  courseId: string;
}

interface PendingDelete {
  kind: StructureEntityKind;
  id: string;
  title: string;
}

const entityLabels: Record<StructureEntityKind, string> = {
  module: "модуль",
  topic: "тему",
  lesson: "урок",
};

export default function CourseBuilderPage() {
  const { courseId } = useParams<RouteParams>();
  const session = useLegacyStaffSession();
  const [, setRevision] = useState(0);
  const [selection, setSelection] = useState<StructureSelection | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isTreeOpen, setIsTreeOpen] = useState(false);

  useEffect(() => subscribeCourseStore(() => setRevision((value) => value + 1)), []);
  const course = getCourse(courseId);
  const structure = getCourseStructure(courseId);
  const closeToast = useCallback(() => setToast(null), []);
  const hasAccess = Boolean(course && session && canStaffUserAccessCourse(course, session.userId));

  if (!course || !session || !hasAccess) {
    return (
      <div className="grid min-h-96 place-items-center rounded-brand border-2 border-line p-6 text-center"><div><h1 className="text-2xl font-black text-navy">{course ? "Нет доступа к курсу" : "Курс не найден"}</h1><Link className="mt-4 inline-block text-sm font-black text-macaw-dark hover:underline" to="/courses">Вернуться к курсам</Link></div></div>
    );
  }

  const selectEntity = (nextSelection: StructureSelection) => {
    setSelection(nextSelection);
    setIsTreeOpen(false);
  };

  const duplicateEntity = (kind: StructureEntityKind, id: string) => {
    const duplicated = kind === "module" ? duplicateModule(id, session.userId) : kind === "topic" ? duplicateTopic(id, session.userId) : duplicateLesson(id, session.userId);
    setSelection({ kind, id: duplicated.id, mode: "edit" });
    setToast({ id: Date.now(), title: "Элемент продублирован", description: `Создана копия: ${duplicated.title}` });
  };

  const moveEntity = (kind: StructureEntityKind, id: string, direction: "up" | "down") => {
    const moved = kind === "module" ? moveModule(id, direction, session.userId) : kind === "topic" ? moveTopic(id, direction, session.userId) : moveLesson(id, direction, session.userId);
    if (moved) setToast({ id: Date.now(), title: "Порядок обновлён" });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "module") deleteModule(pendingDelete.id, session.userId);
    else if (pendingDelete.kind === "topic") deleteTopic(pendingDelete.id, session.userId);
    else deleteLesson(pendingDelete.id, session.userId);
    if (selection?.id === pendingDelete.id) setSelection(null);
    setToast({ id: Date.now(), title: "Элемент удалён", description: pendingDelete.title });
    setPendingDelete(null);
  };

  const editorSaved = (message: string) => {
    setSelection(null);
    setToast({ id: Date.now(), title: message });
  };

  const tree = (
    <CourseStructureTree
      onDelete={(kind, id, title) => setPendingDelete({ kind, id, title })}
      onDuplicate={duplicateEntity}
      onMove={moveEntity}
      onSelect={selectEntity}
      selection={selection}
      structure={structure}
    />
  );

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Link className="inline-flex items-center gap-2 text-sm font-black text-ash hover:text-macaw-dark" to={`/courses/${course.id}`}><ArrowLeft aria-hidden="true" size={17} /> Назад к курсу</Link>
          <span className="mt-5 block text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Course Builder</span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">Структура курса</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ash"><strong className="text-graphite">{course.title}</strong> · {course.code}. Соберите модули, темы и уроки в нужном порядке.</p>
        </div>
        <div className="grid gap-3">
          <Link className="student-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-brand border-2 border-macaw bg-macaw/10 px-4 text-sm font-black text-macaw-dark" to={`/courses/${course.id}/preview`}>
            <Eye aria-hidden="true" size={17} /> Предпросмотр курса
          </Link>
          <div className="grid grid-cols-3 gap-2 sm:flex">
            <BuilderStat label="Модулей" value={structure.modules.length} />
            <BuilderStat label="Тем" value={structure.topics.length} />
            <BuilderStat label="Уроков" value={structure.lessons.length} />
          </div>
        </div>
      </header>

      {course.status === "published" ? <PublishedCourseNotice /> : null}

      <button className="flex min-h-12 items-center justify-between rounded-brand border-2 border-line bg-paper px-4 text-sm font-black text-graphite lg:hidden" onClick={() => setIsTreeOpen(true)} type="button"><span className="flex items-center gap-2"><Menu aria-hidden="true" size={19} /> Открыть структуру</span><span className="rounded-brand bg-mist px-2 py-1 text-xs text-ash">{structure.lessons.length} уроков</span></button>

      <div className="grid min-h-[620px] overflow-hidden rounded-brand border-2 border-line bg-paper lg:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="hidden max-h-[calc(100vh-8rem)] overflow-x-hidden overflow-y-auto border-r-2 border-line bg-mist/50 p-4 lg:block">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-black text-navy">Дерево курса</h2><p className="mt-1 text-xs text-ash">Управление и порядок элементов</p></div><PanelLeftClose aria-hidden="true" className="text-ash" size={20} /></div>
          {tree}
        </aside>
        <main className="min-w-0 p-4 sm:p-6 lg:p-8"><StructureEditor courseId={course.id} onCancel={() => setSelection(null)} onSaved={editorSaved} selection={selection} structure={structure} userId={session.userId} /></main>
      </div>

      {isTreeOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button aria-label="Закрыть структуру курса" className="absolute inset-0 bg-midnight/70" onClick={() => setIsTreeOpen(false)} type="button" />
          <aside aria-label="Структура курса" className="absolute inset-y-0 left-0 w-[min(92vw,430px)] overflow-x-hidden overflow-y-auto border-r-2 border-line bg-mist p-4">
            <div className="mb-4 flex items-start justify-between gap-3"><div><span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-ecto-dark"><Sparkles aria-hidden="true" size={15} /> Course Builder</span><h2 className="mt-2 text-xl font-black text-navy">Структура курса</h2></div><button aria-label="Закрыть" className="grid size-10 place-items-center rounded-brand border-2 border-line bg-paper text-ash" onClick={() => setIsTreeOpen(false)} type="button"><X aria-hidden="true" size={18} /></button></div>
            {tree}
          </aside>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel="Удалить"
        description={pendingDelete ? `Будет удалён ${entityLabels[pendingDelete.kind]} «${pendingDelete.title}»${pendingDelete.kind === "module" ? " вместе со всеми темами и уроками" : pendingDelete.kind === "topic" ? " вместе со всеми уроками" : ""}. Действие нельзя отменить.` : ""}
        isOpen={Boolean(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Удалить элемент структуры?"
      />
      <StaffToast message={toast} onClose={closeToast} />
    </div>
  );
}

function BuilderStat({ label, value }: { label: string; value: number }) {
  return <div className="min-w-24 rounded-brand border-2 border-line bg-paper px-3 py-2 text-center"><strong className="block text-xl font-black text-navy">{value}</strong><span className="text-[10px] font-black uppercase tracking-wider text-ash">{label}</span></div>;
}
