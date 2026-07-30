import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  FileText,
  LockKeyhole,
  PlayCircle,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import ConfirmDialog from "../../components/student/ConfirmDialog";
import MaterialCard from "../../components/student/MaterialCard";
import StatePanel from "../../components/student/StatePanel";
import StatusBadge from "../../components/student/StatusBadge";
import { useStudentProgress } from "../../hooks/useStudentProgress";
import {
  getAdjacentLessons,
  getCourseById,
  getLessonById,
  getMaterialsForLesson,
} from "../../services/studentCatalog";
import {
  getResolvedLessonStatus,
  isLessonLocked,
} from "../../services/studentProgress";

interface LessonRouteParams {
  courseId: string;
  lessonId: string;
}

export default function StudentLessonPage() {
  const { courseId, lessonId } = useParams<LessonRouteParams>();
  const { completeLesson, startLesson, state } = useStudentProgress();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const course = getCourseById(courseId);
  const lesson = getLessonById(lessonId);
  const validLesson = course && lesson?.courseId === course.id ? lesson : null;
  const locked = validLesson ? isLessonLocked(validLesson, state) : false;

  useEffect(() => {
    if (validLesson && !locked) {
      startLesson(validLesson);
    }
  }, [locked, startLesson, validLesson]);

  const closeConfirm = useCallback(() => setIsConfirmOpen(false), []);

  if (!course || !validLesson) {
    return (
      <StatePanel
        action={
          <Link
            className="student-pressable mt-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-2.5 text-sm font-black text-white"
            to="/student/courses"
          >
            Вернуться к курсам
          </Link>
        }
        description="Урок не существует или не относится к выбранному курсу."
        kind="error"
        title="Урок не найден"
      />
    );
  }

  if (locked) {
    return (
      <StatePanel
        action={
          <Link
            className="student-pressable mt-2 inline-flex items-center gap-2 rounded-brand border-2 border-lingot bg-paper px-4 py-2.5 text-sm font-black text-ecto-dark"
            to={`/student/courses/${course.id}`}
          >
            <ArrowLeft aria-hidden="true" size={16} />
            К структуре курса
          </Link>
        }
        description="Завершите предыдущий урок, чтобы открыть этот."
        icon={LockKeyhole}
        title="Урок пока заблокирован"
      />
    );
  }

  const module = course.modules.find(
    (courseModule) => courseModule.id === validLesson.moduleId,
  );
  const materials = getMaterialsForLesson(validLesson);
  const status = getResolvedLessonStatus(validLesson, state);
  const { previous, next } = getAdjacentLessons(course, validLesson.id);
  const nextLocked = next ? isLessonLocked(next, state) : false;

  const confirmCompletion = () => {
    completeLesson(validLesson);
    setIsConfirmOpen(false);
    setShowSuccess(true);
  };

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <nav
        aria-label="Хлебные крошки"
        className="flex flex-wrap items-center gap-2 text-xs font-bold text-ash"
      >
        <Link className="text-macaw-dark hover:underline" to="/student/courses">
          Курсы
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          className="text-macaw-dark hover:underline"
          to={`/student/courses/${course.id}`}
        >
          {course.title}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{validLesson.title}</span>
      </nav>

      {showSuccess && (
        <div
          className="flex items-start gap-3 rounded-brand border-2 border-ecto bg-ecto/10 p-4 text-ecto-dark"
          role="status"
        >
          <Check aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
          <div className="min-w-0 flex-1">
            <strong className="block text-sm font-black">Урок завершён</strong>
            <p className="mt-1 text-xs font-bold leading-5">
              Прогресс курса обновлён. Следующий урок разблокирован.
            </p>
          </div>
          <button
            aria-label="Закрыть уведомление"
            className="grid size-8 place-items-center rounded-brand hover:bg-ecto/10"
            onClick={() => setShowSuccess(false)}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>
      )}

      <header className="grid gap-4 rounded-brand border-2 border-line bg-paper p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-brand border-2 border-navy bg-navy/10 px-2.5 py-1 text-xs font-black text-navy">
            {course.code}
          </span>
          <StatusBadge status={status} />
        </div>
        <div>
          <span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">
            {module?.title ?? "Модуль"}
          </span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">
            {validLesson.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ash">
            {validLesson.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-bold text-ash">
          <span className="flex items-center gap-1.5">
            <Clock3 aria-hidden="true" size={15} />
            {validLesson.durationMinutes} минут
          </span>
          <span className="flex items-center gap-1.5">
            <FileText aria-hidden="true" size={15} />
            {materials.length} материалов
          </span>
        </div>
      </header>

      {validLesson.video && (
        <section className="overflow-hidden rounded-brand border-2 border-line bg-paper">
          {validLesson.video.kind === "youtube" &&
          validLesson.video.embedUrl ? (
            <div className="aspect-video w-full bg-midnight">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
                loading="lazy"
                src={validLesson.video.embedUrl}
                title={validLesson.video.title}
              />
            </div>
          ) : (
            <div className="grid aspect-video place-items-center bg-mist p-6 text-center">
              <div className="grid max-w-md justify-items-center gap-3">
                <span className="grid size-16 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-macaw-dark">
                  <PlayCircle aria-hidden="true" size={31} />
                </span>
                <strong className="text-lg font-black text-navy">
                  Видео недоступно
                </strong>
                <p className="text-sm leading-6 text-ash">
                  {validLesson.video.description}
                </p>
              </div>
            </div>
          )}
          <div className="border-t-2 border-line p-4 sm:p-5">
            <h2 className="text-lg font-black text-navy">
              {validLesson.video.title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-ash">
              {validLesson.video.description}
            </p>
          </div>
        </section>
      )}

      <article className="student-rich-text rounded-brand border-2 border-line bg-paper p-5 leading-7 text-charcoal sm:p-7">
        <ReactMarkdown>{validLesson.content}</ReactMarkdown>
      </article>

      <section className="grid gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">
            Файлы и ссылки
          </span>
          <h2 className="mt-1 text-2xl font-black text-navy">
            Материалы урока
          </h2>
        </div>
        {materials.length ? (
          <div className="grid gap-3">
            {materials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-brand border-2 border-dashed border-line p-5 text-sm font-bold text-ash">
            <AlertCircle aria-hidden="true" size={19} />
            Для этого урока нет прикреплённых материалов.
          </div>
        )}
      </section>

      <footer className="grid gap-3 border-t-2 border-line pt-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        {previous ? (
          <Link
            className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-line bg-paper px-4 py-3 text-sm font-black text-graphite sm:justify-self-start"
            to={`/student/courses/${course.id}/lessons/${previous.id}`}
          >
            <ArrowLeft aria-hidden="true" size={17} />
            Предыдущий урок
          </Link>
        ) : (
          <span />
        )}

        <button
          className="student-pressable min-h-12 rounded-brand border-2 border-ecto-dark bg-ecto px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === "completed"}
          onClick={() => setIsConfirmOpen(true)}
          type="button"
        >
          {status === "completed" ? "Урок завершён" : "Завершить урок"}
        </button>

        {next ? (
          nextLocked ? (
            <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-line bg-mist px-4 py-3 text-sm font-black text-ash sm:justify-self-end">
              Следующий урок
              <LockKeyhole aria-hidden="true" size={16} />
            </span>
          ) : (
            <Link
              className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-lingot bg-paper px-4 py-3 text-sm font-black text-ecto-dark sm:justify-self-end"
              to={`/student/courses/${course.id}/lessons/${next.id}`}
            >
              Следующий урок
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          )
        ) : (
          <span />
        )}
      </footer>

      <ConfirmDialog
        confirmLabel="Завершить"
        description="Статус урока изменится на «Завершён», прогресс курса обновится, а следующий урок станет доступен."
        isOpen={isConfirmOpen}
        onCancel={closeConfirm}
        onConfirm={confirmCompletion}
        title="Завершить урок?"
      />
    </div>
  );
}
