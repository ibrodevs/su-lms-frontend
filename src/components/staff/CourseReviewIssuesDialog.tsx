import { AlertTriangle, ArrowRight, FilePenLine, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { CourseReviewIssue } from "../../services/courseService";

interface CourseReviewIssuesDialogProps {
  courseId: string;
  issues: CourseReviewIssue[];
  onClose: () => void;
}

export default function CourseReviewIssuesDialog({
  courseId,
  issues,
  onClose,
}: CourseReviewIssuesDialogProps) {
  if (!issues.length) return null;

  return (
    <div
      aria-labelledby="course-review-issues-title"
      aria-modal="true"
      className="fixed inset-0 z-[115] grid place-items-center bg-midnight/70 p-4"
      role="dialog"
    >
      <div className="w-full max-w-xl rounded-brand border-2 border-line bg-paper p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-brand bg-danger/10 text-danger">
              <AlertTriangle aria-hidden="true" size={22} />
            </span>
            <div>
              <h2 className="text-xl font-black text-navy" id="course-review-issues-title">
                Курс нельзя отправить на проверку
              </h2>
              <p className="mt-1 text-sm text-ash">Исправьте найденные проблемы и повторите отправку.</p>
            </div>
          </div>
          <button
            aria-label="Закрыть список проблем"
            className="grid size-10 shrink-0 place-items-center rounded-brand border-2 border-line text-ash hover:bg-mist"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <ul className="mt-5 grid gap-2">
          {issues.map((issue) => (
            <li className="flex items-start gap-3 rounded-brand border-2 border-danger/15 bg-danger/5 p-3 text-sm font-bold text-graphite" key={issue.id}>
              <span aria-hidden="true" className="mt-1 size-2 shrink-0 rounded-full bg-danger" />
              {issue.message}
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-brand border-2 border-line px-4 text-sm font-black text-graphite hover:bg-mist"
            onClick={onClose}
            to={`/courses/${courseId}/edit`}
          >
            <FilePenLine aria-hidden="true" size={17} /> Информация курса
          </Link>
          <Link
            className="student-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white"
            onClick={onClose}
            to={`/courses/${courseId}/builder`}
          >
            Открыть Course Builder <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </div>
    </div>
  );
}
