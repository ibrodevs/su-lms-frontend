import { ArrowUpRight, BookOpenText, CalendarDays, FileText, FolderTree, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  createLesson,
  createModule,
  createTopic,
  updateLesson,
  updateModule,
  updateTopic,
} from "../../services/courseStructureService";
import type {
  CourseStructure,
  LessonInput,
  LessonStatus,
  LessonType,
  ModuleInput,
  ReleaseCondition,
  ReleaseConditionType,
  TopicInput,
} from "../../types/staff";
import type { StructureSelection } from "./CourseStructureTree";

interface StructureEditorProps {
  courseId: string;
  userId: string;
  selection: StructureSelection | null;
  structure: CourseStructure;
  onCancel: () => void;
  onSaved: (message: string) => void;
}

interface FieldProps {
  children: React.ReactNode;
  label: string;
  error?: string;
  required?: boolean;
}

function Field({ children, error, label, required = false }: FieldProps) {
  return (
    <label className="grid content-start gap-2">
      <span className="text-xs font-black uppercase tracking-wider text-ash">{label}{required ? <span className="ml-1 text-danger">*</span> : null}</span>
      {children}
      {error ? <span className="text-xs font-bold text-danger">{error}</span> : null}
    </label>
  );
}

function inputClasses(error?: string): string {
  return `min-h-12 w-full rounded-brand border-2 bg-paper px-3 text-sm font-bold text-graphite outline-none ${error ? "border-danger" : "border-line focus:border-macaw"}`;
}

interface ReleaseConditionFieldsProps {
  condition: ReleaseCondition;
  lessons: CourseStructure["lessons"];
  onChange: (condition: ReleaseCondition) => void;
}

function ReleaseConditionFields({ condition, lessons, onChange }: ReleaseConditionFieldsProps) {
  const updateType = (type: ReleaseConditionType) => {
    if (type === "after-lesson") onChange({ type, afterLessonId: lessons[0]?.id });
    else if (type === "date") onChange({ type, availableFrom: new Date().toISOString().slice(0, 10) });
    else onChange({ type });
  };

  return (
    <div className="grid gap-4 rounded-brand border-2 border-line bg-mist/60 p-4 sm:grid-cols-2">
      <Field label="Условие открытия">
        <select className={inputClasses()} onChange={(event) => updateType(event.target.value as ReleaseConditionType)} value={condition.type}>
          <option value="always">Всегда доступно</option>
          <option value="after-previous">После предыдущего элемента</option>
          <option disabled={!lessons.length} value="after-lesson">После выбранного урока</option>
          <option value="date">С определённой даты</option>
        </select>
      </Field>
      {condition.type === "after-lesson" ? (
        <Field label="После урока">
          <select className={inputClasses()} onChange={(event) => onChange({ type: "after-lesson", afterLessonId: event.target.value })} value={condition.afterLessonId ?? ""}>
            {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
          </select>
        </Field>
      ) : null}
      {condition.type === "date" ? (
        <Field label="Дата открытия">
          <input className={inputClasses()} onChange={(event) => onChange({ type: "date", availableFrom: event.target.value })} type="date" value={condition.availableFrom ?? ""} />
        </Field>
      ) : null}
    </div>
  );
}

interface EditorHeaderProps {
  icon: typeof FolderTree;
  title: string;
  subtitle: string;
  onCancel: () => void;
}

function EditorHeader({ icon: Icon, onCancel, subtitle, title }: EditorHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 border-b-2 border-line pb-5">
      <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-brand bg-eel/40 text-ecto-dark"><Icon aria-hidden="true" size={22} /></span><div><h2 className="text-xl font-black text-navy">{title}</h2><p className="mt-1 text-xs leading-5 text-ash">{subtitle}</p></div></div>
      <button aria-label="Закрыть редактор" className="grid size-10 shrink-0 place-items-center rounded-brand border-2 border-line text-ash hover:bg-mist hover:text-graphite" onClick={onCancel} type="button"><X aria-hidden="true" size={17} /></button>
    </header>
  );
}

interface ModuleFormProps extends Omit<StructureEditorProps, "courseId"> {
  courseId: string;
  selection: StructureSelection;
}

function ModuleForm({ courseId, onCancel, onSaved, selection, structure, userId }: ModuleFormProps) {
  const existing = selection.id ? structure.modules.find((module) => module.id === selection.id) : undefined;
  const [form, setForm] = useState<ModuleInput>({ title: "", description: "", openDate: "", closeDate: "", releaseCondition: { type: "always" } });
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(existing ? { title: existing.title, description: existing.description, openDate: existing.openDate ?? "", closeDate: existing.closeDate ?? "", releaseCondition: { ...existing.releaseCondition } } : { title: "", description: "", openDate: "", closeDate: "", releaseCondition: { type: "always" } });
    setError("");
  }, [existing]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) { setError("Введите название модуля."); return; }
    if (form.openDate && form.closeDate && form.closeDate < form.openDate) { setError("Дата закрытия должна быть позже даты открытия."); return; }
    const input = { ...form, openDate: form.openDate || undefined, closeDate: form.closeDate || undefined };
    if (existing) updateModule(existing.id, input, userId);
    else createModule(courseId, input, userId);
    onSaved(existing ? "Модуль сохранён" : "Модуль добавлен");
  };

  return (
    <form className="grid gap-5" noValidate onSubmit={submit}>
      <EditorHeader icon={FolderTree} onCancel={onCancel} subtitle="Настройте название, описание и доступность раздела курса." title={existing ? "Редактирование модуля" : "Новый модуль"} />
      <Field error={error} label="Название модуля" required><input autoFocus className={inputClasses(error)} onChange={(event) => { setForm((current) => ({ ...current, title: event.target.value })); setError(""); }} placeholder="Например, Основы проектирования" value={form.title} /></Field>
      <Field label="Описание"><textarea className={`${inputClasses()} min-h-28 resize-y py-3`} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Кратко опишите содержание модуля" value={form.description} /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Открыть с"><input className={inputClasses()} onChange={(event) => setForm((current) => ({ ...current, openDate: event.target.value }))} type="date" value={form.openDate ?? ""} /></Field><Field label="Закрыть"><input className={inputClasses()} onChange={(event) => setForm((current) => ({ ...current, closeDate: event.target.value }))} type="date" value={form.closeDate ?? ""} /></Field></div>
      <ReleaseConditionFields condition={form.releaseCondition} lessons={structure.lessons} onChange={(releaseCondition) => setForm((current) => ({ ...current, releaseCondition }))} />
      <SubmitActions label={existing ? "Сохранить модуль" : "Добавить модуль"} onCancel={onCancel} />
    </form>
  );
}

interface TopicFormProps extends Omit<StructureEditorProps, "courseId"> {
  selection: StructureSelection;
}

function TopicForm({ onCancel, onSaved, selection, structure, userId }: TopicFormProps) {
  const existing = selection.id ? structure.topics.find((topic) => topic.id === selection.id) : undefined;
  const [form, setForm] = useState<TopicInput>({ title: "", description: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(existing ? { title: existing.title, description: existing.description } : { title: "", description: "" });
    setError("");
  }, [existing]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) { setError("Введите название темы."); return; }
    if (existing) updateTopic(existing.id, form, userId);
    else if (selection.parentId) createTopic(selection.parentId, form, userId);
    else return;
    onSaved(existing ? "Тема сохранена" : "Тема добавлена");
  };

  return (
    <form className="grid gap-5" noValidate onSubmit={submit}>
      <EditorHeader icon={BookOpenText} onCancel={onCancel} subtitle="Тема объединяет связанные уроки внутри одного модуля." title={existing ? "Редактирование темы" : "Новая тема"} />
      <Field error={error} label="Название темы" required><input autoFocus className={inputClasses(error)} onChange={(event) => { setForm((current) => ({ ...current, title: event.target.value })); setError(""); }} placeholder="Например, Компонентный подход" value={form.title} /></Field>
      <Field label="Описание"><textarea className={`${inputClasses()} min-h-32 resize-y py-3`} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Что студент изучит в этой теме" value={form.description} /></Field>
      <SubmitActions label={existing ? "Сохранить тему" : "Добавить тему"} onCancel={onCancel} />
    </form>
  );
}

interface LessonFormProps extends StructureEditorProps {
  selection: StructureSelection;
}

const lessonTypeLabels: Record<LessonType, string> = { text: "Текст", video: "Видео", material: "Материал", mixed: "Смешанный", "external-link": "Внешняя ссылка" };
const emptyLessonInput: LessonInput = { title: "", description: "", type: "text", durationMinutes: 15, available: true, releaseCondition: { type: "always" }, status: "draft", content: "", videoKind: "none" };

function LessonForm({ courseId, onCancel, onSaved, selection, structure, userId }: LessonFormProps) {
  const existing = selection.id ? structure.lessons.find((lesson) => lesson.id === selection.id) : undefined;
  const [form, setForm] = useState<LessonInput>(emptyLessonInput);
  const [errors, setErrors] = useState<{ title?: string; duration?: string }>({});

  useEffect(() => {
    setForm(existing ? { title: existing.title, description: existing.description, type: existing.type, durationMinutes: existing.durationMinutes, available: existing.available, releaseCondition: { ...existing.releaseCondition }, status: existing.status, content: existing.content, videoKind: existing.videoKind, videoUrl: existing.videoUrl, videoTitle: existing.videoTitle, videoDescription: existing.videoDescription } : emptyLessonInput);
    setErrors({});
  }, [existing]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!form.title.trim()) nextErrors.title = "Введите название урока.";
    if (!Number.isFinite(form.durationMinutes) || form.durationMinutes < 1 || form.durationMinutes > 600) nextErrors.duration = "Укажите от 1 до 600 минут.";
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    if (existing) updateLesson(existing.id, form, userId);
    else if (selection.parentId) createLesson(selection.parentId, form, userId);
    else return;
    onSaved(existing ? "Урок сохранён" : "Урок добавлен");
  };

  return (
    <form className="grid gap-5" noValidate onSubmit={submit}>
      <EditorHeader icon={FileText} onCancel={onCancel} subtitle="Задайте тип, длительность, статус и условия открытия урока." title={existing ? "Редактирование урока" : "Новый урок"} />
      {existing ? <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-brand border-2 border-macaw px-4 text-sm font-black text-macaw-dark hover:bg-macaw/10" to={`/courses/${courseId}/lessons/${existing.id}/edit`}>Открыть редактор контента <ArrowUpRight aria-hidden="true" size={17} /></Link> : null}
      <Field error={errors.title} label="Название урока" required><input autoFocus className={inputClasses(errors.title)} onChange={(event) => { setForm((current) => ({ ...current, title: event.target.value })); setErrors((current) => ({ ...current, title: undefined })); }} placeholder="Например, Первый React-компонент" value={form.title} /></Field>
      <Field label="Описание"><textarea className={`${inputClasses()} min-h-28 resize-y py-3`} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Цель и ожидаемый результат урока" value={form.description} /></Field>
      <div className="grid gap-4 sm:grid-cols-3"><Field label="Тип урока"><select className={inputClasses()} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as LessonType }))} value={form.type}>{(Object.entries(lessonTypeLabels) as Array<[LessonType, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field error={errors.duration} label="Длительность, мин"><input className={inputClasses(errors.duration)} min="1" max="600" onChange={(event) => setForm((current) => ({ ...current, durationMinutes: Number(event.target.value) }))} type="number" value={form.durationMinutes} /></Field><Field label="Статус"><select className={inputClasses()} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as LessonStatus }))} value={form.status}><option value="draft">Черновик</option><option value="ready">Готов</option></select></Field></div>
      <label className="flex min-h-12 items-center gap-3 rounded-brand border-2 border-line px-4 text-sm font-black text-graphite"><input checked={form.available} className="size-5 accent-[#27a8e0]" onChange={(event) => setForm((current) => ({ ...current, available: event.target.checked }))} type="checkbox" /> Показывать урок в структуре курса</label>
      <ReleaseConditionFields condition={form.releaseCondition} lessons={structure.lessons.filter((lesson) => lesson.id !== existing?.id)} onChange={(releaseCondition) => setForm((current) => ({ ...current, releaseCondition }))} />
      <SubmitActions label={existing ? "Сохранить урок" : "Добавить урок"} onCancel={onCancel} />
    </form>
  );
}

function SubmitActions({ label, onCancel }: { label: string; onCancel: () => void }) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t-2 border-line pt-5 sm:flex-row sm:justify-end"><button className="min-h-11 rounded-brand border-2 border-line px-5 text-sm font-black text-graphite hover:bg-mist" onClick={onCancel} type="button">Отмена</button><button className="student-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white" type="submit"><Save aria-hidden="true" size={17} /> {label}</button></div>
  );
}

export default function StructureEditor(props: StructureEditorProps) {
  if (!props.selection) {
    return (
      <div className="grid min-h-[480px] place-items-center text-center"><div className="max-w-sm"><span className="mx-auto grid size-16 place-items-center rounded-brand border-2 border-eel bg-eel/30 text-ecto-dark"><CalendarDays aria-hidden="true" size={30} /></span><h2 className="mt-5 text-xl font-black text-navy">Выберите элемент структуры</h2><p className="mt-2 text-sm leading-6 text-ash">Откройте модуль, тему или урок слева либо создайте новый элемент.</p></div></div>
    );
  }
  if (props.selection.kind === "module") return <ModuleForm {...props} selection={props.selection} />;
  if (props.selection.kind === "topic") return <TopicForm {...props} selection={props.selection} />;
  return <LessonForm {...props} selection={props.selection} />;
}
