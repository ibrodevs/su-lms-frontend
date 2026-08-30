import { AlertTriangle } from "lucide-react";

interface PublishedCourseNoticeProps {
  className?: string;
}

export default function PublishedCourseNotice({ className = "" }: PublishedCourseNoticeProps) {
  return (
    <aside
      className={`flex items-start gap-3 rounded-brand border-2 border-warning/50 bg-warning/10 p-4 ${className}`}
      role="status"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-brand bg-warning/20 text-warning-dark">
        <AlertTriangle aria-hidden="true" size={20} />
      </span>
      <div>
        <strong className="text-sm font-black text-warning-dark">Вы редактируете опубликованный курс</strong>
        <p className="mt-1 text-xs leading-5 text-graphite">
          Изменения опубликованного курса могут потребовать повторной проверки перед обновлением материалов для студентов.
        </p>
      </div>
    </aside>
  );
}
