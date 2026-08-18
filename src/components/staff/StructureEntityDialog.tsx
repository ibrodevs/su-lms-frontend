import { X } from "lucide-react";
import { useState } from "react";
import type {
  LessonType,
  LessonWritePayload,
  ModuleWritePayload,
  StructureLessonDto,
  StructureModuleDto,
  StructureTopicDto,
  TopicWritePayload,
} from "../../api/learning.api";

export type StructureEditorTarget =
  | { kind: "module"; parentId: number; entity?: StructureModuleDto }
  | { kind: "topic"; parentId: number; entity?: StructureTopicDto }
  | { kind: "lesson"; parentId: number; entity?: StructureLessonDto };

export type StructureSaveRequest =
  | { kind: "module"; parentId: number; entityId?: number; payload: ModuleWritePayload }
  | { kind: "topic"; parentId: number; entityId?: number; payload: TopicWritePayload }
  | { kind: "lesson"; parentId: number; entityId?: number; payload: LessonWritePayload };

interface StructureEntityDialogProps {
  availableLessons: StructureLessonDto[];
  error?: string;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (request: StructureSaveRequest) => void;
  target: StructureEditorTarget;
}

const entityLabels = { module: "модуль", topic: "тему", lesson: "урок" } as const;
const lessonTypeLabels: Record<LessonType, string> = {
  text: "Текст",
  video: "Видео",
  material: "Материал",
  mixed: "Смешанный",
  external_link: "Внешняя ссылка",
};

export default function StructureEntityDialog({ availableLessons, error, isPending, onCancel, onSubmit, target }: StructureEntityDialogProps) {
  const entity = target.entity;
  const lesson = target.kind === "lesson" ? target.entity : undefined;
  const module = target.kind === "module" ? target.entity : undefined;
  const [title, setTitle] = useState(entity?.title ?? "");
  const [description, setDescription] = useState("");
  const [lessonType, setLessonType] = useState<LessonType>(lesson?.lesson_type ?? "text");
  const [duration, setDuration] = useState(lesson?.estimated_duration_minutes ? String(lesson.estimated_duration_minutes) : "");
  const [isPublished, setIsPublished] = useState(lesson?.is_published ?? false);
  const [releaseType, setReleaseType] = useState(lesson?.release_type ?? module?.release_type ?? "always");
  const [releaseAt, setReleaseAt] = useState((lesson?.release_at ?? module?.release_at ?? "").slice(0, 16));
  const [requiredLesson, setRequiredLesson] = useState(lesson?.required_lesson ? String(lesson.required_lesson) : "");
  const isDateInvalid = releaseType === "date" && !releaseAt;
  const isDependencyInvalid = target.kind === "lesson" && releaseType === "after_lesson" && !requiredLesson;
  const isInvalid = !title.trim() || isDateInvalid || isDependencyInvalid;

  const submit = () => {
    if (isInvalid) return;
    if (target.kind === "module") {
      onSubmit({
        kind: "module",
        parentId: target.parentId,
        entityId: target.entity?.id,
        payload: {
          title: title.trim(),
          ...(target.entity ? {} : { description: description.trim() }),
          release_type: releaseType === "after_lesson" ? "always" : releaseType,
          release_at: releaseType === "date" ? new Date(releaseAt).toISOString() : null,
        },
      });
      return;
    }
    if (target.kind === "topic") {
      onSubmit({
        kind: "topic",
        parentId: target.parentId,
        entityId: target.entity?.id,
        payload: { title: title.trim(), ...(target.entity ? {} : { description: description.trim() }) },
      });
      return;
    }
    onSubmit({
      kind: "lesson",
      parentId: target.parentId,
      entityId: target.entity?.id,
      payload: {
        title: title.trim(),
        ...(target.entity ? {} : { description: description.trim() }),
        lesson_type: lessonType,
        estimated_duration_minutes: duration ? Number(duration) : null,
        release_type: releaseType,
        release_at: releaseType === "date" ? new Date(releaseAt).toISOString() : null,
        required_lesson: releaseType === "after_lesson" ? Number(requiredLesson) : null,
        is_published: isPublished,
      },
    });
  };

  return (
    <div aria-labelledby="structure-editor-title" aria-modal="true" className="fixed inset-0 z-[110] grid place-items-center bg-midnight/70 p-4" role="dialog">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-brand border-2 border-line bg-paper p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-ecto-dark">Course Builder</span>
            <h2 className="mt-2 text-2xl font-black text-navy" id="structure-editor-title">{entity ? "Изменить" : "Добавить"} {entityLabels[target.kind]}</h2>
          </div>
          <button aria-label="Закрыть" className="grid size-10 place-items-center rounded-brand border-2 border-line text-ash" disabled={isPending} onClick={onCancel} type="button"><X aria-hidden="true" size={18} /></button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field className="sm:col-span-2" label="Название" required><input autoFocus className={inputClasses} maxLength={255} onChange={(event) => setTitle(event.target.value)} value={title} /></Field>
          {!entity ? <Field className="sm:col-span-2" label="Описание"><textarea className={`${inputClasses} min-h-24 py-3`} onChange={(event) => setDescription(event.target.value)} value={description} /></Field> : null}

          {target.kind === "lesson" ? <>
            <Field label="Тип урока"><select className={inputClasses} onChange={(event) => setLessonType(event.target.value as LessonType)} value={lessonType}>{(Object.entries(lessonTypeLabels) as Array<[LessonType, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="Длительность, мин"><input className={inputClasses} min="1" onChange={(event) => setDuration(event.target.value)} type="number" value={duration} /></Field>
          </> : null}

          {target.kind !== "topic" ? <>
            <Field label="Условие открытия"><select className={inputClasses} onChange={(event) => setReleaseType(event.target.value as typeof releaseType)} value={releaseType}><option value="always">Всегда доступен</option><option value="after_previous">После предыдущего</option>{target.kind === "lesson" ? <option value="after_lesson">После выбранного урока</option> : null}<option value="date">По дате</option></select></Field>
            {releaseType === "date" ? <Field label="Дата открытия" required><input className={inputClasses} onChange={(event) => setReleaseAt(event.target.value)} type="datetime-local" value={releaseAt} /></Field> : null}
            {target.kind === "lesson" && releaseType === "after_lesson" ? <Field label="Обязательный урок" required><select className={inputClasses} onChange={(event) => setRequiredLesson(event.target.value)} value={requiredLesson}><option value="">Выберите урок</option>{availableLessons.filter((item) => item.id !== target.entity?.id).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field> : null}
          </> : null}

          {target.kind === "lesson" ? <label className="flex min-h-12 items-center gap-3 self-end rounded-brand border-2 border-line px-4 text-sm font-black text-graphite"><input checked={isPublished} className="size-5 accent-[#27a8e0]" onChange={(event) => setIsPublished(event.target.checked)} type="checkbox" /> Опубликован в структуре</label> : null}
        </div>

        {error ? <p className="mt-5 rounded-brand border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{error}</p> : null}
        <div className="mt-6 grid grid-cols-2 gap-3"><button className="min-h-11 rounded-brand border-2 border-line text-sm font-black text-graphite" disabled={isPending} onClick={onCancel} type="button">Отмена</button><button className="student-pressable min-h-11 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white disabled:opacity-50" disabled={isInvalid || isPending} onClick={submit} type="button">{isPending ? "Сохранение…" : "Сохранить"}</button></div>
      </div>
    </div>
  );
}

const inputClasses = "min-h-12 w-full rounded-brand border-2 border-line bg-paper px-3 text-sm font-bold text-graphite outline-none focus:border-macaw";

function Field({ children, className, label, required = false }: { children: React.ReactNode; className?: string; label: string; required?: boolean }) {
  return <label className={`grid content-start gap-2 ${className ?? ""}`}><span className="text-xs font-black uppercase tracking-wider text-ash">{label}{required ? <span className="ml-1 text-danger">*</span> : null}</span>{children}</label>;
}
