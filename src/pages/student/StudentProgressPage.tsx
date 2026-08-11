import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  LockKeyhole,
  Play,
  ListChecks,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import CourseProgress from "../../components/student/CourseProgress";
import PageHeading from "../../components/student/PageHeading";
import StatusBadge from "../../components/student/StatusBadge";
import { mockActivity } from "../../data/student/mockActivity";
import { mockAssignments } from "../../data/student/mockAssignments";
import { mockTests } from "../../data/student/mockTests";
import { useStudentProgress } from "../../hooks/useStudentProgress";
import {
  getLessonById,
  getLessonsForCourse,
  getCourseById,
  mockCourses,
} from "../../services/studentCatalog";
import {
  getCourseProgress,
  getResolvedLessonStatus,
} from "../../services/studentProgress";
import { getStudentLocalState } from "../../services/studentStorage";

const activityFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Almaty",
});

export default function StudentProgressPage() {
  const { state } = useStudentProgress();
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(
    "digital-literacy",
  );
  const summaries = mockCourses.map((course) => ({
    course,
    progress: getCourseProgress(course, state),
  }));
  const totalLessons = summaries.reduce(
    (total, item) => total + item.progress.total,
    0,
  );
  const completedLessons = summaries.reduce(
    (total, item) => total + item.progress.completed,
    0,
  );
  const overallPercent = totalLessons
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;
  const activeCourses = summaries.filter(
    (item) => item.progress.status === "in-progress",
  ).length;
  const completedCourses = summaries.filter(
    (item) => item.progress.status === "completed",
  ).length;
  const localState = getStudentLocalState();
  const completedAssignments = mockAssignments.filter((assignment) => {
    const status = localState.assignments[assignment.id]?.status ?? assignment.status;
    return status === "submitted" || status === "reviewed";
  }).length;
  const testResults = Object.values(localState.testResults).filter((result) =>
    mockTests.some((test) => test.id === result.testId),
  );
  const passedTests = testResults.filter((result) => result.passed).length;
  const averageTestResult = testResults.length
    ? Math.round(
        testResults.reduce((total, result) => total + result.percent, 0) /
          testResults.length,
      )
    : 0;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7">
      <PageHeading
        description="Общий результат и детализация прохождения по каждому курсу."
        eyebrow="Обучение"
        title="Мой прогресс"
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-brand border-2 border-ecto bg-ecto/10 p-5">
          <TrendingUp
            aria-hidden="true"
            className="text-ecto-dark"
            size={24}
          />
          <strong className="mt-4 block text-3xl font-black text-navy">
            {overallPercent}%
          </strong>
          <span className="text-xs font-bold text-ash">Общий прогресс</span>
        </article>
        <article className="rounded-brand border-2 border-macaw bg-macaw/10 p-5">
          <BookOpen
            aria-hidden="true"
            className="text-macaw-dark"
            size={24}
          />
          <strong className="mt-4 block text-3xl font-black text-navy">
            {activeCourses}
          </strong>
          <span className="text-xs font-bold text-ash">Активные курсы</span>
        </article>
        <article className="rounded-brand border-2 border-line bg-paper p-5">
          <CheckCircle2
            aria-hidden="true"
            className="text-ecto-dark"
            size={24}
          />
          <strong className="mt-4 block text-3xl font-black text-navy">
            {completedLessons}
          </strong>
          <span className="text-xs font-bold text-ash">
            Завершённые уроки
          </span>
        </article>
        <article className="rounded-brand border-2 border-line bg-paper p-5">
          <Award aria-hidden="true" className="text-navy" size={24} />
          <strong className="mt-4 block text-3xl font-black text-navy">{completedCourses}</strong>
          <span className="text-xs font-bold text-ash">Завершённые курсы</span>
        </article>
        <article className="rounded-brand border-2 border-line bg-paper p-5">
          <ClipboardList aria-hidden="true" className="text-ecto-dark" size={24} />
          <strong className="mt-4 block text-3xl font-black text-navy">{completedAssignments}</strong>
          <span className="text-xs font-bold text-ash">Выполненные задания</span>
        </article>
        <article className="rounded-brand border-2 border-line bg-paper p-5">
          <ListChecks aria-hidden="true" className="text-macaw-dark" size={24} />
          <strong className="mt-4 block text-3xl font-black text-navy">{passedTests}</strong>
          <span className="text-xs font-bold text-ash">Пройденные тесты</span>
        </article>
        <article className="rounded-brand border-2 border-line bg-paper p-5">
          <TrendingUp aria-hidden="true" className="text-warning" size={24} />
          <strong className="mt-4 block text-3xl font-black text-navy">{averageTestResult}%</strong>
          <span className="text-xs font-bold text-ash">Средний результат</span>
        </article>
      </section>

      <section className="rounded-brand border-2 border-line p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-navy">Общий результат</h2>
          <strong className="text-xl font-black text-ecto-dark">
            {completedLessons}/{totalLessons}
          </strong>
        </div>
        <CourseProgress
          label="Завершено уроков"
          percent={overallPercent}
        />
      </section>

      <section className="grid gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">
            По курсам
          </span>
          <h2 className="mt-1 text-2xl font-black text-navy">
            Детализация прогресса
          </h2>
        </div>

        {summaries.map(({ course, progress }) => {
          const isExpanded = expandedCourseId === course.id;
          const lessons = getLessonsForCourse(course);
          const currentLesson = progress.continuationLessonId
            ? getLessonById(progress.continuationLessonId)
            : null;
          const lastOpenedLesson = progress.lastOpenedLessonId
            ? getLessonById(progress.lastOpenedLessonId)
            : null;
          const currentModule = currentLesson
            ? course.modules.find(
                (module) => module.id === currentLesson.moduleId,
              )
            : null;
          const inProgressCount = lessons.filter(
            (lesson) =>
              getResolvedLessonStatus(lesson, state) === "in-progress",
          ).length;
          const lockedCount = lessons.filter(
            (lesson) => getResolvedLessonStatus(lesson, state) === "locked",
          ).length;

          return (
            <article
              className="overflow-hidden rounded-brand border-2 border-line bg-paper"
              key={course.id}
            >
              <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-navy">
                      {course.title}
                    </h3>
                    <StatusBadge status={progress.status} />
                  </div>
                  <p className="mt-1 text-xs font-bold text-ash">
                    {course.instructor.name}
                  </p>
                  <p className="mt-2 text-xs text-ash">
                    Текущий модуль:{" "}
                    <strong className="text-graphite">
                      {currentModule?.title ?? "Курс завершён"}
                    </strong>
                  </p>
                  <p className="mt-1 text-xs text-ash">
                    Последний открытый урок:{" "}
                    <strong className="text-graphite">
                      {lastOpenedLesson?.title ?? "Нет активности"}
                    </strong>
                  </p>
                </div>
                <CourseProgress percent={progress.percent} compact />
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {currentLesson && (
                    <Link
                      className="student-pressable inline-flex min-h-10 items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-3 py-2 text-xs font-black text-white"
                      to={`/student/courses/${course.id}/lessons/${currentLesson.id}`}
                    >
                      <Play aria-hidden="true" size={14} />
                      Продолжить
                    </Link>
                  )}
                  <button
                    aria-expanded={isExpanded}
                    className="inline-flex min-h-10 items-center gap-2 rounded-brand border-2 border-line px-3 py-2 text-xs font-black text-ash hover:bg-mist"
                    onClick={() =>
                      setExpandedCourseId(isExpanded ? null : course.id)
                    }
                    type="button"
                  >
                    Детали
                    <ChevronDown
                      aria-hidden="true"
                      className={isExpanded ? "rotate-180" : undefined}
                      size={15}
                    />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="grid gap-4 border-t-2 border-line bg-mist p-5">
                  <div className="flex flex-wrap gap-3 text-xs font-black">
                    <span className="inline-flex items-center gap-1.5 rounded-brand border-2 border-ecto/30 bg-paper px-3 py-1.5 text-ecto-dark">
                      <CheckCircle2 aria-hidden="true" size={14} />
                      {progress.completed} завершено
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-brand border-2 border-macaw/30 bg-paper px-3 py-1.5 text-macaw-dark">
                      <Clock3 aria-hidden="true" size={14} />
                      {inProgressCount} в процессе
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-brand border-2 border-line bg-paper px-3 py-1.5 text-ash">
                      <LockKeyhole aria-hidden="true" size={14} />
                      {lockedCount} заблокировано
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {course.modules.map((module) => {
                      const moduleLessons = module.topics
                        .flatMap((topic) => topic.lessonIds)
                        .map((lessonId) => getLessonById(lessonId))
                        .filter((lesson) => lesson !== null);
                      const moduleCompleted = moduleLessons.filter(
                        (lesson) =>
                          getResolvedLessonStatus(lesson, state) ===
                          "completed",
                      ).length;
                      const modulePercent = moduleLessons.length
                        ? Math.round(
                            (moduleCompleted / moduleLessons.length) * 100,
                          )
                        : 0;

                      return (
                        <div
                          className="rounded-brand border-2 border-line bg-paper p-4"
                          key={module.id}
                        >
                          <strong className="block text-sm font-black text-navy">
                            {module.title}
                          </strong>
                          <p className="mt-1 text-xs font-bold text-ash">
                            {moduleCompleted}/{moduleLessons.length} уроков
                          </p>
                          <div className="mt-3">
                            <CourseProgress
                              compact
                              label="Модуль"
                              percent={modulePercent}
                            />
                          </div>
                          <ul className="mt-4 grid gap-2">
                            {moduleLessons.map((lesson) => {
                              const lessonStatus = getResolvedLessonStatus(
                                lesson,
                                state,
                              );
                              const lessonTitle = (
                                <span className="min-w-0 flex-1 truncate text-xs font-bold text-graphite">
                                  {lesson.title}
                                </span>
                              );

                              return (
                                <li
                                  className="flex min-w-0 items-center gap-2 rounded-brand border border-line bg-mist px-3 py-2"
                                  key={lesson.id}
                                >
                                  {lessonStatus === "locked" ? (
                                    lessonTitle
                                  ) : (
                                    <Link
                                      className="min-w-0 flex-1 hover:underline"
                                      to={`/student/courses/${course.id}/lessons/${lesson.id}`}
                                    >
                                      {lessonTitle}
                                    </Link>
                                  )}
                                  <StatusBadge status={lessonStatus} />
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  <Link
                    className="inline-flex w-fit items-center gap-2 text-xs font-black text-macaw-dark hover:underline"
                    to={`/student/courses/${course.id}`}
                  >
                    Открыть структуру курса
                    <ArrowRight aria-hidden="true" size={15} />
                  </Link>
                </div>
              )}
            </article>
          );
        })}
      </section>

      <section className="grid gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">История</span>
          <h2 className="mt-1 text-2xl font-black text-navy">Последняя активность</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {mockActivity.map((activity) => {
            const activityCourse = getCourseById(activity.courseId);
            const target = activity.lessonId
              ? `/student/courses/${activity.courseId}/lessons/${activity.lessonId}`
              : `/student/courses/${activity.courseId}`;
            return (
              <Link className="rounded-brand border-2 border-line bg-paper p-4 hover:border-lingot hover:bg-ecto/5" key={activity.id} to={target}>
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm font-black text-navy">{activity.title}</strong>
                  <time className="shrink-0 text-[10px] font-black text-ash">{activityFormatter.format(new Date(activity.occurredAt))}</time>
                </div>
                <p className="mt-2 text-xs leading-5 text-ash">{activity.description}</p>
                <span className="mt-2 block text-[10px] font-black uppercase tracking-wider text-macaw-dark">{activityCourse?.title}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
