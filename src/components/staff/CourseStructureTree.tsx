import {
  BookOpenText,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit3,
  FileText,
  FolderTree,
  Plus,
  Trash2,
} from "lucide-react";
import type { CourseLesson, CourseModule, CourseStructure, CourseTopic } from "../../types/staff";
import { cn } from "../../utils/cn";

export type StructureEntityKind = "module" | "topic" | "lesson";

export interface StructureSelection {
  kind: StructureEntityKind;
  id?: string;
  parentId?: string;
  mode: "create" | "edit";
}

interface CourseStructureTreeProps {
  structure: CourseStructure;
  selection: StructureSelection | null;
  onSelect: (selection: StructureSelection) => void;
  onDuplicate: (kind: StructureEntityKind, id: string) => void;
  onMove: (kind: StructureEntityKind, id: string, direction: "up" | "down") => void;
  onDelete: (kind: StructureEntityKind, id: string, title: string) => void;
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

function ActionButton({ children, danger = false, disabled = false, label, onClick }: ActionButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-brand border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-30 sm:size-8",
        danger ? "text-danger hover:border-danger/30 hover:bg-danger/5" : "text-ash hover:border-line hover:bg-paper hover:text-graphite",
      )}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

interface RowActionsProps {
  kind: StructureEntityKind;
  id: string;
  title: string;
  index: number;
  total: number;
  onSelect: CourseStructureTreeProps["onSelect"];
  onDuplicate: CourseStructureTreeProps["onDuplicate"];
  onMove: CourseStructureTreeProps["onMove"];
  onDelete: CourseStructureTreeProps["onDelete"];
}

function RowActions({ kind, id, index, onDelete, onDuplicate, onMove, onSelect, title, total }: RowActionsProps) {
  return (
    <span className="flex w-full items-center justify-end sm:w-auto">
      <ActionButton label={`Редактировать ${title}`} onClick={() => onSelect({ kind, id, mode: "edit" })}><Edit3 aria-hidden="true" size={14} /></ActionButton>
      <ActionButton disabled={index === 0} label={`Поднять ${title}`} onClick={() => onMove(kind, id, "up")}><ChevronUp aria-hidden="true" size={14} /></ActionButton>
      <ActionButton disabled={index === total - 1} label={`Опустить ${title}`} onClick={() => onMove(kind, id, "down")}><ChevronDown aria-hidden="true" size={14} /></ActionButton>
      <ActionButton label={`Дублировать ${title}`} onClick={() => onDuplicate(kind, id)}><Copy aria-hidden="true" size={14} /></ActionButton>
      <ActionButton danger label={`Удалить ${title}`} onClick={() => onDelete(kind, id, title)}><Trash2 aria-hidden="true" size={14} /></ActionButton>
    </span>
  );
}

function isSelected(selection: StructureSelection | null, kind: StructureEntityKind, id: string): boolean {
  return selection?.mode === "edit" && selection.kind === kind && selection.id === id;
}

interface LessonRowProps extends Pick<CourseStructureTreeProps, "selection" | "onSelect" | "onDuplicate" | "onMove" | "onDelete"> {
  lesson: CourseLesson;
  index: number;
  total: number;
}

function LessonRow({ index, lesson, onDelete, onDuplicate, onMove, onSelect, selection, total }: LessonRowProps) {
  return (
    <div className={cn("min-w-0 rounded-brand border-2 pl-2", isSelected(selection, "lesson", lesson.id) ? "border-macaw bg-macaw/5" : "border-transparent bg-paper")}>
      <div className="flex min-w-0 flex-wrap items-center gap-2 py-1.5">
        <FileText aria-hidden="true" className="shrink-0 text-macaw-dark" size={15} />
        <button className="min-w-0 flex-1 truncate text-left text-xs font-extrabold text-graphite" onClick={() => onSelect({ kind: "lesson", id: lesson.id, mode: "edit" })} type="button">{lesson.title}</button>
        <RowActions kind="lesson" id={lesson.id} index={index} onDelete={onDelete} onDuplicate={onDuplicate} onMove={onMove} onSelect={onSelect} title={lesson.title} total={total} />
      </div>
    </div>
  );
}

interface TopicBlockProps extends Pick<CourseStructureTreeProps, "structure" | "selection" | "onSelect" | "onDuplicate" | "onMove" | "onDelete"> {
  topic: CourseTopic;
  index: number;
  total: number;
}

function TopicBlock({ index, onDelete, onDuplicate, onMove, onSelect, selection, structure, topic, total }: TopicBlockProps) {
  const lessons = structure.lessons.filter((lesson) => lesson.topicId === topic.id);
  return (
    <div className={cn("min-w-0 rounded-brand border-2 p-2", isSelected(selection, "topic", topic.id) ? "border-ecto bg-ecto/5" : "border-line bg-mist/50")}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <BookOpenText aria-hidden="true" className="shrink-0 text-ecto-dark" size={16} />
        <button className="min-w-0 flex-1 truncate text-left text-xs font-black text-graphite" onClick={() => onSelect({ kind: "topic", id: topic.id, mode: "edit" })} type="button">{topic.title}</button>
        <RowActions kind="topic" id={topic.id} index={index} onDelete={onDelete} onDuplicate={onDuplicate} onMove={onMove} onSelect={onSelect} title={topic.title} total={total} />
      </div>
      <div className="mt-2 grid gap-1 pl-3">
        {lessons.map((lesson, lessonIndex) => (
          <LessonRow index={lessonIndex} key={lesson.id} lesson={lesson} onDelete={onDelete} onDuplicate={onDuplicate} onMove={onMove} onSelect={onSelect} selection={selection} total={lessons.length} />
        ))}
        <button className="flex min-h-9 items-center gap-2 rounded-brand border-2 border-dashed border-line px-3 text-left text-xs font-black text-ash hover:border-macaw hover:text-macaw-dark" onClick={() => onSelect({ kind: "lesson", parentId: topic.id, mode: "create" })} type="button"><Plus aria-hidden="true" size={14} /> Добавить урок</button>
      </div>
    </div>
  );
}

interface ModuleBlockProps extends Pick<CourseStructureTreeProps, "structure" | "selection" | "onSelect" | "onDuplicate" | "onMove" | "onDelete"> {
  module: CourseModule;
  index: number;
  total: number;
}

function ModuleBlock({ index, module, onDelete, onDuplicate, onMove, onSelect, selection, structure, total }: ModuleBlockProps) {
  const topics = structure.topics.filter((topic) => topic.moduleId === module.id);
  return (
    <section className={cn("min-w-0 rounded-brand border-2 p-3", isSelected(selection, "module", module.id) ? "border-lingot bg-lingot/5" : "border-line bg-paper")}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <FolderTree aria-hidden="true" className="shrink-0 text-lingot" size={18} />
        <button className="min-w-0 flex-1 truncate text-left text-sm font-black text-navy" onClick={() => onSelect({ kind: "module", id: module.id, mode: "edit" })} type="button">{module.title}</button>
        <RowActions kind="module" id={module.id} index={index} onDelete={onDelete} onDuplicate={onDuplicate} onMove={onMove} onSelect={onSelect} title={module.title} total={total} />
      </div>
      <div className="mt-3 grid gap-2 pl-2">
        {topics.map((topic, topicIndex) => (
          <TopicBlock index={topicIndex} key={topic.id} onDelete={onDelete} onDuplicate={onDuplicate} onMove={onMove} onSelect={onSelect} selection={selection} structure={structure} topic={topic} total={topics.length} />
        ))}
        <button className="flex min-h-10 items-center gap-2 rounded-brand border-2 border-dashed border-line px-3 text-left text-xs font-black text-ash hover:border-ecto hover:text-ecto-dark" onClick={() => onSelect({ kind: "topic", parentId: module.id, mode: "create" })} type="button"><Plus aria-hidden="true" size={15} /> Добавить тему</button>
      </div>
    </section>
  );
}

export default function CourseStructureTree({ onDelete, onDuplicate, onMove, onSelect, selection, structure }: CourseStructureTreeProps) {
  return (
    <div className="grid min-w-0 gap-3">
      {structure.modules.length ? structure.modules.map((module, index) => (
        <ModuleBlock index={index} key={module.id} module={module} onDelete={onDelete} onDuplicate={onDuplicate} onMove={onMove} onSelect={onSelect} selection={selection} structure={structure} total={structure.modules.length} />
      )) : (
        <div className="rounded-brand border-2 border-dashed border-line p-5 text-center"><FolderTree aria-hidden="true" className="mx-auto text-ash" size={28} /><p className="mt-2 text-xs font-bold leading-5 text-ash">Структура пуста. Создайте первый модуль.</p></div>
      )}
      <button className="student-pressable flex min-h-11 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white" onClick={() => onSelect({ kind: "module", mode: "create" })} type="button"><Plus aria-hidden="true" size={17} /> Добавить модуль</button>
    </div>
  );
}
