import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Clock3, FileText, LockKeyhole, Play, X } from "lucide-react";
import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import { studentApi } from "../../api/student.api";
import { studentKeys } from "../../api/studentKeys";
import ConfirmDialog from "../../components/student/ConfirmDialog";
import MaterialCard from "../../components/student/MaterialCard";
import StatePanel from "../../components/student/StatePanel";
import StatusBadge from "../../components/student/StatusBadge";
import { findStudentLessonContext, flattenStudentLessons, resolveStudentLessonStatus, translateLockReason } from "../../utils/studentLearning";

interface LessonRouteParams {
  courseId: string;
  lessonId: string;
}

export default function StudentLessonPage() {
  const { courseId: courseIdParam, lessonId: lessonIdParam } = useParams<LessonRouteParams>();
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const courseId = Number(courseIdParam);
  const lessonId = Number(lessonIdParam);
  const hasValidIds = Number.isInteger(courseId) && courseId > 0 && Number.isInteger(lessonId) && lessonId > 0;
  const courseQuery = useQuery({ enabled: hasValidIds, queryKey: studentKeys.course(courseId), queryFn: () => studentApi.course(courseId) });
  const lessonQuery = useQuery({ enabled: hasValidIds, queryKey: studentKeys.lesson(lessonId), queryFn: () => studentApi.lesson(lessonId) });

  const invalidateProgress = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: studentKeys.lesson(lessonId) }),
      queryClient.invalidateQueries({ queryKey: studentKeys.course(courseId) }),
      queryClient.invalidateQueries({ queryKey: studentKeys.courseProgress(courseId) }),
      queryClient.invalidateQueries({ queryKey: studentKeys.progress() }),
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard() }),
    ]);
  };
  const startMutation = useMutation({ mutationFn: () => studentApi.startLesson(lessonId), onSuccess: invalidateProgress });
  const completeMutation = useMutation({
    mutationFn: () => studentApi.completeLesson(lessonId),
    onSuccess: async () => {
      await invalidateProgress();
      setShowSuccess(true);
    },
  });
  const closeConfirm = useCallback(() => setIsConfirmOpen(false), []);

  if (!hasValidIds) return <LessonError courseId={courseIdParam} description="Ссылка на урок содержит некорректный идентификатор." />;
  if (courseQuery.isPending || lessonQuery.isPending) return <StatePanel description="Получаем урок, материалы, статус и доступность с backend." kind="loading" title="Загрузка урока" />;
  if (courseQuery.isError || lessonQuery.isError) return <LessonError courseId={courseIdParam} description={(courseQuery.error ?? lessonQuery.error)?.message ?? "Не удалось получить урок."} />;

  const course = courseQuery.data;
  const lesson = lessonQuery.data;
  const lessonContext = findStudentLessonContext(course, lesson.id);
  if (!lessonContext) return <LessonError courseId={courseIdParam} description="Урок не входит в доступную структуру выбранного курса." />;
  if (!lesson.is_available) return <StatePanel action={<Link className="student-pressable mt-2 inline-flex items-center gap-2 rounded-brand border-2 border-lingot bg-paper px-4 py-2.5 text-sm font-black text-ecto-dark" to={`/student/courses/${course.id}`}><ArrowLeft aria-hidden="true" size={16} />К структуре курса</Link>} description={translateLockReason(lesson.lock_reason)} icon={LockKeyhole} title="Урок пока заблокирован" />;

  const lessonContexts = flattenStudentLessons(course);
  const lessonIndex = lessonContexts.findIndex(({ lesson: item }) => item.id === lesson.id);
  const previous = lessonIndex > 0 ? lessonContexts[lessonIndex - 1]?.lesson : undefined;
  const next = lessonIndex >= 0 ? lessonContexts[lessonIndex + 1]?.lesson : undefined;
  const status = resolveStudentLessonStatus(lesson);
  const mutationError = startMutation.error ?? completeMutation.error;

  const confirmCompletion = () => {
    setIsConfirmOpen(false);
    completeMutation.mutate();
  };

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <nav aria-label="Хлебные крошки" className="flex flex-wrap items-center gap-2 text-xs font-bold text-ash"><Link className="text-macaw-dark hover:underline" to="/student/courses">Курсы</Link><span aria-hidden="true">/</span><Link className="text-macaw-dark hover:underline" to={`/student/courses/${course.id}`}>{course.title}</Link><span aria-hidden="true">/</span><span aria-current="page">{lesson.title}</span></nav>

      {showSuccess ? <div className="flex items-start gap-3 rounded-brand border-2 border-ecto bg-ecto/10 p-4 text-ecto-dark" role="status"><Check aria-hidden="true" className="mt-0.5 shrink-0" size={20} /><div className="min-w-0 flex-1"><strong className="block text-sm font-black">Урок завершён</strong><p className="mt-1 text-xs font-bold leading-5">Прогресс получен с backend, доступность следующего урока обновлена.</p></div><button aria-label="Закрыть уведомление" className="grid size-8 place-items-center rounded-brand hover:bg-ecto/10" onClick={() => setShowSuccess(false)} type="button"><X aria-hidden="true" size={16} /></button></div> : null}
      {mutationError ? <div className="rounded-brand border-2 border-danger bg-danger/10 p-4 text-sm font-bold text-danger" role="alert">{mutationError.message}</div> : null}

      <header className="grid gap-4 rounded-brand border-2 border-line bg-paper p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-brand border-2 border-navy bg-navy/10 px-2.5 py-1 text-xs font-black text-navy">{course.code}</span><StatusBadge status={status} /></div>
        <div><span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">{lessonContext.module.title} · {lessonContext.topic.title}</span><h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">{lesson.title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-ash">{lesson.description || "Описание урока пока не добавлено."}</p></div>
        <div className="flex flex-wrap gap-4 text-xs font-bold text-ash"><span className="flex items-center gap-1.5"><Clock3 aria-hidden="true" size={15} />{lesson.estimated_duration_minutes ?? 0} минут</span><span className="flex items-center gap-1.5"><FileText aria-hidden="true" size={15} />{lesson.materials.length} материалов</span></div>
        {lesson.status === "not_started" ? <button className="student-pressable inline-flex min-h-11 w-fit items-center gap-2 rounded-brand border-2 border-macaw bg-macaw px-4 py-2.5 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60" disabled={startMutation.isPending} onClick={() => startMutation.mutate()} type="button"><Play aria-hidden="true" size={16} />{startMutation.isPending ? "Начинаем…" : "Начать урок"}</button> : null}
      </header>

      {lesson.content ? <article className="student-rich-text rounded-brand border-2 border-line bg-paper p-5 leading-7 text-charcoal sm:p-7"><ReactMarkdown>{lesson.content}</ReactMarkdown></article> : <StatePanel description="Backend не вернул содержимое для этого доступного урока." title="Содержимое пока не добавлено" />}

      <section className="grid gap-4"><div><span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Файлы и ссылки</span><h2 className="mt-1 text-2xl font-black text-navy">Материалы урока</h2></div>{lesson.materials.length ? <div className="grid gap-3">{lesson.materials.map((material) => <MaterialCard courseId={course.id} key={material.id} lessonId={lesson.id} material={material} />)}</div> : <div className="flex items-center gap-3 rounded-brand border-2 border-dashed border-line p-5 text-sm font-bold text-ash"><AlertCircle aria-hidden="true" size={19} />Для этого урока нет прикреплённых материалов.</div>}</section>

      <footer className="grid gap-3 border-t-2 border-line pt-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        {previous?.is_available ? <Link className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-line bg-paper px-4 py-3 text-sm font-black text-graphite sm:justify-self-start" to={`/student/courses/${course.id}/lessons/${previous.id}`}><ArrowLeft aria-hidden="true" size={17} />Предыдущий урок</Link> : <span />}
        <button className="student-pressable min-h-12 rounded-brand border-2 border-ecto-dark bg-ecto px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={lesson.status !== "in_progress" || completeMutation.isPending} onClick={() => setIsConfirmOpen(true)} type="button">{completeMutation.isPending ? "Сохраняем…" : lesson.status === "completed" ? "Урок завершён" : lesson.status === "not_started" ? "Сначала начните урок" : "Завершить урок"}</button>
        {next ? next.is_available ? <Link className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-lingot bg-paper px-4 py-3 text-sm font-black text-ecto-dark sm:justify-self-end" to={`/student/courses/${course.id}/lessons/${next.id}`}>Следующий урок<ArrowRight aria-hidden="true" size={17} /></Link> : <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-line bg-mist px-4 py-3 text-sm font-black text-ash sm:justify-self-end">Следующий урок<LockKeyhole aria-hidden="true" size={16} /></span> : <span />}
      </footer>

      <ConfirmDialog confirmLabel="Завершить" description="Backend сохранит завершение, пересчитает прогресс и доступность следующих уроков." isOpen={isConfirmOpen} onCancel={closeConfirm} onConfirm={confirmCompletion} title="Завершить урок?" />
    </div>
  );
}

function LessonError({ courseId, description }: { courseId: string; description: string }) {
  const target = /^\d+$/.test(courseId) ? `/student/courses/${courseId}` : "/student/courses";
  return <StatePanel action={<Link className="student-pressable mt-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-2.5 text-sm font-black text-white" to={target}>Вернуться к курсу</Link>} description={description} kind="error" title="Урок недоступен" />;
}
