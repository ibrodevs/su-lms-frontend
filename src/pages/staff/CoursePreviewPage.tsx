import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  GraduationCap,
  LockKeyhole,
  PlayCircle,
  UserRound,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import CourseProgress from "../../components/student/CourseProgress";
import MaterialPreviewDialog from "../../components/staff/MaterialPreviewDialog";
import { subscribeCourseStore } from "../../services/courseService";
import {
  getCoursePreview,
  type PreviewLesson,
  type PreviewModule,
} from "../../services/coursePreviewService";
import { getStaffSession } from "../../services/staffSession";
import { canStaffUserAccessCourse } from "../../services/staffAuthorization";
import type { StaffMaterial } from "../../types/staff";
import { formatFileSize, staffMaterialTypeLabels } from "../../utils/materialDisplay";

interface RouteParams {
  courseId: string;
}

const languageLabels = {
  ru: "Русский",
  ky: "Кыргызский",
  en: "English",
} as const;

export default function CoursePreviewPage() {
  const { courseId } = useParams<RouteParams>();
  const session = getStaffSession();
  const [, setRevision] = useState(0);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<StaffMaterial | null>(null);

  useEffect(() => subscribeCourseStore(() => setRevision((value) => value + 1)), []);
  useEffect(() => setSelectedLessonId(null), [courseId]);

  const preview = getCoursePreview(courseId);
  const hasAccess = Boolean(
    preview &&
      session &&
      canStaffUserAccessCourse(preview.course, session.userId),
  );
  const selectedLesson = preview
    ? preview.lessons.find((item) => item.lesson.id === selectedLessonId) ??
      preview.lessons.find((item) => item.status === "available") ??
      preview.lessons.find((item) => item.status === "completed") ??
      null
    : null;

  if (!preview || !session || !hasAccess) {
    return (
      <div className="student-theme grid min-h-screen place-items-center bg-mist p-5">
        <section className="w-full max-w-xl rounded-brand border-2 border-line bg-paper p-8 text-center">
          <LockKeyhole aria-hidden="true" className="mx-auto text-macaw-dark" size={42} />
          <h1 className="mt-4 text-2xl font-black text-navy">
            {preview ? "Нет доступа к предпросмотру" : "Курс не найден"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-ash">
            {preview
              ? "Преподаватель может просматривать только назначенные ему курсы."
              : "Возможно, курс был удалён или ссылка устарела."}
          </p>
          <Link
            className="student-pressable mt-5 inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white"
            to="/courses"
          >
            <ArrowLeft aria-hidden="true" size={17} /> К списку курсов
          </Link>
        </section>
      </div>
    );
  }

  const { course } = preview;

  return (
    <div className="student-theme min-h-screen bg-mist text-graphite">
      <header className="sticky top-0 z-40 border-b-2 border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex min-h-18 max-w-[1280px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            aria-label="SU LMS — вернуться к редактированию"
            className="flex min-w-0 items-center gap-3"
            to={`/courses/${course.id}/builder`}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-brand border-2 border-ecto-dark bg-ecto text-white">
              <BookOpen aria-hidden="true" size={21} />
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm font-black text-navy">SU LMS</strong>
              <span className="block truncate text-[10px] font-black uppercase tracking-[0.13em] text-ecto-dark">
                Student Preview
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-brand border-2 border-macaw/30 bg-macaw/10 px-3 py-2 text-xs font-black text-macaw-dark sm:inline-flex">
              <Eye aria-hidden="true" size={15} /> Режим предпросмотра
            </span>
            <Link
              className="student-pressable inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-3 text-xs font-black text-white sm:px-4 sm:text-sm"
              to={`/courses/${course.id}/builder`}
            >
              <ArrowLeft aria-hidden="true" size={16} />
              <span className="hidden sm:inline">Вернуться к редактированию</span>
              <span className="sm:hidden">Назад</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1280px] gap-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="overflow-hidden rounded-brand border-2 border-line bg-paper">
          <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="relative grid min-h-64 place-items-center overflow-hidden border-b-2 border-line bg-gradient-to-br from-navy via-macaw-dark to-ecto-dark p-7 text-white lg:border-b-0 lg:border-r-2">
              {course.coverDataUrl ? (
                <img
                  alt={`Обложка курса ${course.title}`}
                  className="absolute inset-0 size-full object-cover"
                  src={course.coverDataUrl}
                />
              ) : (
                <div className="relative z-10 grid justify-items-center gap-4 text-center">
                  <span className="grid size-20 place-items-center rounded-brand border-2 border-white/50 bg-white/15">
                    <BookOpen aria-hidden="true" size={40} />
                  </span>
                  <span className="text-sm font-black uppercase tracking-[0.2em]">{course.code}</span>
                  <strong className="max-w-xs text-2xl font-black leading-tight">{course.title}</strong>
                </div>
              )}
              <div aria-hidden="true" className="absolute -bottom-20 -right-16 size-56 rounded-full border-[32px] border-white/10" />
            </div>

            <div className="grid content-center gap-5 p-5 sm:p-7 lg:p-9">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-brand border-2 border-navy bg-navy/10 px-2.5 py-1 text-xs font-black text-navy">
                  {course.code}
                </span>
                <span className="rounded-brand border-2 border-eel bg-ecto/10 px-2.5 py-1 text-xs font-black text-ecto-dark">
                  Предпросмотр студента
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-navy sm:text-4xl lg:text-5xl">
                  {course.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-ash sm:text-base">
                  {course.description}
                </p>
              </div>
              <CourseProgress percent={preview.progressPercent} />
              <p className="text-xs font-bold text-ash">
                Демонстрационный прогресс: завершено {preview.completedLessonCount} из {preview.totalLessonCount} уроков
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <PreviewMeta icon={UserRound} label="Преподаватель" value={preview.teacherName} />
          <PreviewMeta icon={GraduationCap} label="Кредиты" value={`${course.credits} кредитов`} />
          <PreviewMeta icon={BookOpen} label="Семестр" value={preview.semesterName} />
          <PreviewMeta icon={FileText} label="Язык" value={languageLabels[course.language]} />
        </section>

        <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(330px,0.85fr)_minmax(0,1.35fr)] lg:items-start">
          <div className="grid gap-4">
            <header>
              <span className="text-xs font-black uppercase tracking-[0.15em] text-ecto-dark">Учебный план</span>
              <h2 className="mt-1 text-2xl font-black text-navy">Содержание курса</h2>
              <p className="mt-1 text-sm text-ash">Модули, темы и уроки в порядке прохождения.</p>
            </header>

            {preview.modules.length ? (
              preview.modules.map((module, index) => (
                <PreviewModuleCard
                  initiallyOpen={index === 0}
                  key={module.module.id}
                  module={module}
                  onSelectLesson={setSelectedLessonId}
                  selectedLessonId={selectedLesson?.lesson.id ?? null}
                />
              ))
            ) : (
              <div className="rounded-brand border-2 border-dashed border-line bg-paper p-6 text-center">
                <BookOpen aria-hidden="true" className="mx-auto text-ash" size={34} />
                <h3 className="mt-3 text-lg font-black text-navy">Структура пока не добавлена</h3>
                <p className="mt-2 text-sm text-ash">Добавьте модули, темы и уроки в Course Builder.</p>
              </div>
            )}
          </div>

          <LessonPreview
            lesson={selectedLesson}
            onPreviewMaterial={setPreviewMaterial}
          />
        </section>

        <footer className="flex flex-col items-start justify-between gap-4 rounded-brand border-2 border-line bg-paper p-5 sm:flex-row sm:items-center">
          <div>
            <strong className="text-base font-black text-navy">Предпросмотр завершён</strong>
            <p className="mt-1 text-sm text-ash">Вернитесь в Course Builder, чтобы изменить структуру или содержимое.</p>
          </div>
          <Link
            className="student-pressable inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white sm:w-auto"
            to={`/courses/${course.id}/builder`}
          >
            <ArrowLeft aria-hidden="true" size={17} /> Вернуться к редактированию
          </Link>
        </footer>
      </main>

      <MaterialPreviewDialog material={previewMaterial} onClose={() => setPreviewMaterial(null)} />
    </div>
  );
}

function PreviewMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <article className="flex min-w-0 items-center gap-3 rounded-brand border-2 border-line bg-paper p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-brand bg-macaw/10 text-macaw-dark">
        <Icon aria-hidden="true" size={20} />
      </span>
      <div className="min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-wider text-ash">{label}</span>
        <strong className="mt-1 block truncate text-sm font-black text-graphite">{value}</strong>
      </div>
    </article>
  );
}

function PreviewModuleCard({
  initiallyOpen,
  module,
  onSelectLesson,
  selectedLessonId,
}: {
  initiallyOpen: boolean;
  module: PreviewModule;
  onSelectLesson: (lessonId: string) => void;
  selectedLessonId: string | null;
}) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const lessonCount = module.topics.reduce((total, topic) => total + topic.lessons.length, 0);

  return (
    <article className="overflow-hidden rounded-brand border-2 border-line bg-paper">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-mist"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <span className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-ecto-dark">
            Модуль {module.module.order} · {lessonCount} уроков
          </span>
          <strong className="mt-1 block text-base font-black text-navy">{module.module.title}</strong>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`shrink-0 text-ash transition-transform ${isOpen ? "rotate-180" : ""}`}
          size={19}
        />
      </button>

      {isOpen ? (
        <div className="grid gap-4 border-t-2 border-line bg-mist/40 p-3 sm:p-4">
          {module.topics.map((topic) => (
            <section key={topic.topic.id}>
              <h3 className="px-2 text-xs font-black uppercase tracking-wider text-ash">
                {topic.topic.title}
              </h3>
              <div className="mt-2 grid gap-2">
                {topic.lessons.map((previewLesson) => {
                  const isLocked = previewLesson.status === "locked";
                  const isSelected = selectedLessonId === previewLesson.lesson.id;
                  return (
                    <button
                      aria-current={isSelected ? "true" : undefined}
                      className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-brand border-2 p-3 text-left ${
                        isSelected
                          ? "border-ecto bg-ecto/10"
                          : isLocked
                            ? "cursor-not-allowed border-line bg-paper/70 opacity-80"
                            : "border-transparent bg-paper hover:border-lingot"
                      }`}
                      disabled={isLocked}
                      key={previewLesson.lesson.id}
                      onClick={() => onSelectLesson(previewLesson.lesson.id)}
                      title={previewLesson.lockReason}
                      type="button"
                    >
                      <LessonStateIcon status={previewLesson.status} />
                      <span className="min-w-0">
                        <strong className="block text-sm font-black text-graphite">
                          {previewLesson.lesson.title}
                        </strong>
                        <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-ash">
                          <span>{previewLesson.lesson.durationMinutes} мин</span>
                          <span>{previewLesson.materials.length} материалов</span>
                        </span>
                        {previewLesson.lockReason ? (
                          <span className="mt-1 block text-[11px] font-bold leading-4 text-warning-dark">
                            {previewLesson.lockReason}
                          </span>
                        ) : null}
                      </span>
                      {previewLesson.status === "available" ? (
                        <PlayCircle aria-hidden="true" className="mt-0.5 text-ecto-dark" size={18} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function LessonStateIcon({ status }: { status: PreviewLesson["status"] }) {
  if (status === "completed") {
    return (
      <span className="grid size-9 place-items-center rounded-brand bg-ecto/15 text-ecto-dark">
        <CheckCircle2 aria-hidden="true" size={18} />
      </span>
    );
  }
  if (status === "locked") {
    return (
      <span className="grid size-9 place-items-center rounded-brand bg-mist text-ash">
        <LockKeyhole aria-hidden="true" size={17} />
      </span>
    );
  }
  return (
    <span className="grid size-9 place-items-center rounded-brand bg-macaw/10 text-macaw-dark">
      <BookOpen aria-hidden="true" size={17} />
    </span>
  );
}

function LessonPreview({
  lesson,
  onPreviewMaterial,
}: {
  lesson: PreviewLesson | null;
  onPreviewMaterial: (material: StaffMaterial) => void;
}) {
  if (!lesson) {
    return (
      <section className="grid min-h-96 place-items-center rounded-brand border-2 border-dashed border-line bg-paper p-7 text-center lg:sticky lg:top-24">
        <div>
          <BookOpen aria-hidden="true" className="mx-auto text-ash" size={42} />
          <h2 className="mt-4 text-xl font-black text-navy">Выберите доступный урок</h2>
          <p className="mt-2 text-sm leading-6 text-ash">Содержимое урока появится в этой области.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-brand border-2 border-line bg-paper lg:sticky lg:top-24">
      <header className="border-b-2 border-line p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-black text-ecto-dark">
          <span>{lesson.status === "completed" ? "Завершённый урок" : "Доступный урок"}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 text-ash">
            <Clock3 aria-hidden="true" size={14} /> {lesson.lesson.durationMinutes} минут
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-navy sm:text-3xl">
          {lesson.lesson.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ash">{lesson.lesson.description}</p>
      </header>

      <div className="grid gap-5 p-5 sm:p-6">
        {lesson.lesson.videoKind === "youtube" && lesson.lesson.videoUrl ? (
          <div className="aspect-video overflow-hidden rounded-brand border-2 border-line bg-midnight">
            <iframe
              allowFullScreen
              className="size-full"
              src={lesson.lesson.videoUrl}
              title={lesson.lesson.videoTitle || lesson.lesson.title}
            />
          </div>
        ) : null}

        {lesson.lesson.videoKind === "placeholder" ? (
          <div className="grid aspect-video max-h-96 place-items-center rounded-brand border-2 border-dashed border-line bg-midnight p-6 text-center text-white">
            <div>
              <Video aria-hidden="true" className="mx-auto" size={42} />
              <strong className="mt-3 block text-lg font-black">
                {lesson.lesson.videoTitle || "Видео урока"}
              </strong>
              <p className="mt-2 text-sm text-white/70">
                {lesson.lesson.videoDescription || "Видео будет добавлено позже."}
              </p>
            </div>
          </div>
        ) : null}

        <article className="student-rich-text prose prose-sm max-w-none text-charcoal">
          <ReactMarkdown>{lesson.lesson.content || "Контент урока пока не заполнен."}</ReactMarkdown>
        </article>

        <section className="border-t-2 border-line pt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-ecto-dark">Материалы урока</span>
              <h3 className="mt-1 text-lg font-black text-navy">Файлы и ресурсы</h3>
            </div>
            <span className="rounded-brand bg-mist px-3 py-1.5 text-xs font-black text-ash">
              {lesson.materials.length}
            </span>
          </div>

          {lesson.materials.length ? (
            <div className="mt-4 grid gap-3">
              {lesson.materials.map((material) => (
                <article
                  className="grid min-w-0 gap-3 rounded-brand border-2 border-line p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                  key={material.id}
                >
                  <span className="grid size-11 place-items-center rounded-brand bg-macaw/10 text-macaw-dark">
                    <FileText aria-hidden="true" size={20} />
                  </span>
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-black text-graphite">{material.title}</strong>
                    <span className="mt-1 block truncate text-xs font-bold text-ash">
                      {staffMaterialTypeLabels[material.type]} · {formatFileSize(material.sizeBytes)}
                    </span>
                  </div>
                  <button
                    className="student-pressable inline-flex min-h-10 items-center justify-center gap-2 rounded-brand border-2 border-lingot px-4 text-xs font-black text-ecto-dark disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={material.availability !== "available"}
                    onClick={() => onPreviewMaterial(material)}
                    type="button"
                  >
                    <Eye aria-hidden="true" size={15} /> Просмотреть
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-brand border-2 border-dashed border-line p-4 text-sm font-bold text-ash">
              <FileText aria-hidden="true" size={20} /> К этому уроку материалы не прикреплены.
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
