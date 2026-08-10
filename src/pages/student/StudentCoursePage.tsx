import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  ListChecks,
  Mail,
  Play,
  Star,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import CourseProgress from "../../components/student/CourseProgress";
import MaterialCard from "../../components/student/MaterialCard";
import ModuleAccordion from "../../components/student/ModuleAccordion";
import StatePanel from "../../components/student/StatePanel";
import StatusBadge from "../../components/student/StatusBadge";
import { mockAssignments } from "../../data/student/mockAssignments";
import { mockTests } from "../../data/student/mockTests";
import { useStudentProgress } from "../../hooks/useStudentProgress";
import {
  getCourseById,
  getLessonsForCourse,
  getMaterialsForCourse,
  getMaterialsForLesson,
} from "../../services/studentCatalog";
import { getStudentLocalState } from "../../services/studentStorage";
import {
  getCourseProgress,
  getNextAvailableLesson,
} from "../../services/studentProgress";

interface CourseRouteParams {
  courseId: string;
}

type CourseTab =
  | "overview"
  | "content"
  | "materials"
  | "assignments"
  | "tests"
  | "results";

const courseTabs: Array<{ id: CourseTab; label: string }> = [
  { id: "overview", label: "Обзор" },
  { id: "content", label: "Содержание" },
  { id: "materials", label: "Материалы" },
  { id: "assignments", label: "Задания" },
  { id: "tests", label: "Тесты" },
  { id: "results", label: "Результаты" },
];

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function StudentCoursePage() {
  const { courseId } = useParams<CourseRouteParams>();
  const { state } = useStudentProgress();
  const [activeTab, setActiveTab] = useState<CourseTab>("overview");
  const course = getCourseById(courseId);

  if (!course) {
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
        description="Возможно, курс был удалён или ссылка устарела."
        kind="error"
        title="Курс не найден"
      />
    );
  }

  const progress = getCourseProgress(course, state);
  const nextLesson = getNextAvailableLesson(course, state);
  const lessons = getLessonsForCourse(course);
  const courseMaterials = [
    ...getMaterialsForCourse(course),
    ...lessons.flatMap((lesson) => getMaterialsForLesson(lesson)),
  ].filter(
    (material, index, materials) =>
      materials.findIndex((candidate) => candidate.id === material.id) === index,
  );
  const courseAssignments = mockAssignments.filter(
    (assignment) => assignment.courseId === course.id,
  );
  const courseTests = mockTests.filter((test) => test.courseId === course.id);
  const localState = getStudentLocalState();
  const nearestDeadline = [...courseAssignments]
    .filter((assignment) => new Date(assignment.dueAt).getTime() >= Date.now())
    .sort(
      (left, right) =>
        new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime(),
    )[0];

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7">
      <nav aria-label="Хлебные крошки">
        <Link
          className="inline-flex items-center gap-2 text-xs font-black text-macaw-dark hover:underline"
          to="/student/courses"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Мои курсы
        </Link>
      </nav>

      <section className="overflow-hidden rounded-brand border-2 border-line bg-paper">
        <div className="grid lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="grid min-h-64 place-items-center border-b-2 border-line bg-ecto/10 p-6 lg:border-b-0 lg:border-r-2">
            <img
              alt=""
              className="h-56 w-full object-contain"
              src={course.coverImage}
            />
          </div>
          <div className="grid content-center gap-5 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-brand border-2 border-navy bg-navy/10 px-2.5 py-1 text-xs font-black text-navy">
                {course.code}
              </span>
              <StatusBadge status={progress.status} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-navy sm:text-4xl">
                {course.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ash">
                {course.description}
              </p>
            </div>
            <CourseProgress percent={progress.percent} />
            {nextLesson ? (
              <Link
                className="student-pressable inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 py-3 text-sm font-black text-white"
                to={`/student/courses/${course.id}/lessons/${nextLesson.id}`}
              >
                <Play aria-hidden="true" fill="currentColor" size={17} />
                Продолжить обучение
              </Link>
            ) : (
              <span className="inline-flex w-fit items-center gap-2 rounded-brand border-2 border-ecto bg-ecto/10 px-4 py-2 text-sm font-black text-ecto-dark">
                <Star aria-hidden="true" size={17} />
                Курс завершён
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="flex items-center gap-3 rounded-brand border-2 border-line p-4">
          <UserRound aria-hidden="true" className="text-macaw-dark" size={21} />
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-ash">
              Преподаватель
            </span>
            <strong className="text-sm font-black text-graphite">
              {course.instructor.name}
            </strong>
          </div>
        </article>
        <article className="flex items-center gap-3 rounded-brand border-2 border-line p-4">
          <GraduationCap
            aria-hidden="true"
            className="text-ecto-dark"
            size={21}
          />
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-ash">
              Кредиты
            </span>
            <strong className="text-sm font-black text-graphite">
              {course.credits} кредита
            </strong>
          </div>
        </article>
        <article className="flex items-center gap-3 rounded-brand border-2 border-line p-4">
          <BookOpen aria-hidden="true" className="text-navy" size={21} />
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-ash">
              Семестр
            </span>
            <strong className="text-sm font-black text-graphite">
              {course.semester}
            </strong>
          </div>
        </article>
        <article className="flex items-center gap-3 rounded-brand border-2 border-line p-4">
          <CalendarDays
            aria-hidden="true"
            className="text-warning"
            size={21}
          />
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-ash">
              Период
            </span>
            <strong className="text-xs font-black text-graphite">
              {dateFormatter.format(new Date(course.startDate))} —{" "}
              {dateFormatter.format(new Date(course.endDate))}
            </strong>
          </div>
        </article>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-brand border-2 border-line p-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-ash">Структура</span>
          <strong className="mt-1 block text-lg font-black text-navy">{course.modules.length} модулей · {lessons.length} уроков</strong>
        </article>
        <article className="rounded-brand border-2 border-line p-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-ash">Учебный год</span>
          <strong className="mt-1 block text-lg font-black text-navy">{new Date(course.startDate).getFullYear()}–{new Date(course.endDate).getFullYear()}</strong>
        </article>
        <article className="rounded-brand border-2 border-line p-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-ash">Ближайший дедлайн</span>
          <strong className="mt-1 block text-sm font-black text-navy">
            {nearestDeadline ? `${nearestDeadline.title} · ${dateFormatter.format(new Date(nearestDeadline.dueAt))}` : "Нет активных дедлайнов"}
          </strong>
        </article>
      </section>

      <nav aria-label="Разделы курса" className="flex max-w-full gap-2 overflow-x-auto border-b-2 border-line pb-3">
        {courseTabs.map((tab) => (
          <button
            aria-pressed={activeTab === tab.id}
            className={activeTab === tab.id
              ? "shrink-0 rounded-brand border-2 border-ecto bg-ecto/10 px-4 py-2.5 text-xs font-black text-ecto-dark"
              : "shrink-0 rounded-brand border-2 border-line bg-paper px-4 py-2.5 text-xs font-black text-ash hover:bg-mist"}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && (
        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-brand border-2 border-line p-5">
            <h2 className="text-lg font-black text-navy">Цели и программа</h2>
            <p className="mt-3 text-sm leading-6 text-ash">{course.description}</p>
            <ul className="mt-4 grid gap-2">
              {course.syllabus.map((item) => (
                <li className="flex gap-2 text-sm leading-5 text-ash" key={item}>
                  <ArrowRight aria-hidden="true" className="mt-0.5 shrink-0 text-ecto-dark" size={15} />
                  {item}
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-brand border-2 border-line p-5">
            <h2 className="text-lg font-black text-navy">О преподавателе</h2>
            <p className="mt-3 text-sm leading-6 text-ash">{course.instructor.bio}</p>
            <a className="mt-4 inline-flex items-center gap-2 text-xs font-black text-macaw-dark hover:underline" href={`mailto:${course.instructor.email}`}>
              <Mail aria-hidden="true" size={15} />
              {course.instructor.email}
            </a>
          </article>
          <article className="rounded-brand border-2 border-line p-5">
            <h2 className="text-lg font-black text-navy">Текущий результат</h2>
            <CourseProgress percent={progress.percent} />
            <p className="mt-4 text-sm leading-6 text-ash">
              Завершено {progress.completed} из {progress.total} уроков. {course.prerequisites.length ? `Требования: ${course.prerequisites.join(", ")}.` : "Предварительных требований нет."}
            </p>
          </article>
        </section>
      )}

      {activeTab === "content" && (
        <section className="grid gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.15em] text-ecto-dark">Учебный план</span>
            <h2 className="mt-1 text-2xl font-black text-navy">Структура курса</h2>
            <p className="mt-1 text-sm text-ash">Курс → модуль → тема → урок</p>
          </div>
          {course.modules.map((module, index) => (
            <ModuleAccordion course={course} initiallyOpen={index === 0} key={module.id} module={module} state={state} />
          ))}
        </section>
      )}

      {activeTab === "materials" && (
        courseMaterials.length ? (
          <section className="grid gap-4">
            <h2 className="text-2xl font-black text-navy">Материалы курса</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {courseMaterials.map((material) => <MaterialCard key={material.id} material={material} />)}
            </div>
          </section>
        ) : <StatePanel title="Материалов пока нет" description="Для этого курса дополнительные материалы ещё не опубликованы." />
      )}

      {activeTab === "assignments" && (
        courseAssignments.length ? (
          <section className="grid gap-3">
            {courseAssignments.map((assignment) => {
              const assignmentState = localState.assignments[assignment.id];
              return (
                <Link className="grid gap-3 rounded-brand border-2 border-line bg-paper p-5 hover:border-lingot md:grid-cols-[1fr_auto] md:items-center" key={assignment.id} to={`/student/assignments/${assignment.id}`}>
                  <span>
                    <span className="text-xs font-black uppercase tracking-wider text-ecto-dark">{assignmentState?.status ?? assignment.status}</span>
                    <strong className="mt-1 block text-lg font-black text-navy">{assignment.title}</strong>
                    <span className="mt-1 block text-sm text-ash">{assignment.description}</span>
                  </span>
                  <span className="text-right text-xs font-black text-ash">до {dateFormatter.format(new Date(assignment.dueAt))}<br />{assignment.maxScore} баллов</span>
                </Link>
              );
            })}
          </section>
        ) : <StatePanel title="Заданий пока нет" description="В этом курсе нет опубликованных заданий." />
      )}

      {activeTab === "tests" && (
        courseTests.length ? (
          <section className="grid gap-3 md:grid-cols-2">
            {courseTests.map((test) => (
              <article className="grid gap-4 rounded-brand border-2 border-line bg-paper p-5" key={test.id}>
                <div className="flex items-start justify-between gap-3">
                  <ListChecks className="text-macaw-dark" size={22} />
                  <span className="text-xs font-black text-ash">{test.questions.length} вопросов · {test.durationMinutes} мин</span>
                </div>
                <div><h2 className="text-lg font-black text-navy">{test.title}</h2><p className="mt-1 text-sm text-ash">{test.description}</p></div>
                {test.status === "locked" ? (
                  <span className="rounded-brand border-2 border-line bg-mist px-4 py-2.5 text-center text-sm font-black text-ash">Тест заблокирован</span>
                ) : (
                  <Link className="student-pressable rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-2.5 text-center text-sm font-black text-white" to={`/student/tests/${test.id}`}>Начать тест</Link>
                )}
              </article>
            ))}
          </section>
        ) : <StatePanel title="Тестов пока нет" description="В этом курсе нет доступных тестов." />
      )}

      {activeTab === "results" && (
        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-brand border-2 border-line bg-paper p-5">
            <div className="flex items-center gap-3"><ClipboardList className="text-ecto-dark" size={22} /><h2 className="text-lg font-black text-navy">Задания</h2></div>
            <ul className="mt-4 grid gap-2">
              {courseAssignments.map((assignment) => {
                const assignmentState = localState.assignments[assignment.id];
                return <li className="flex items-center justify-between gap-3 rounded-brand border border-line bg-mist px-3 py-2 text-xs" key={assignment.id}><span className="font-black text-graphite">{assignment.title}</span><span className="font-bold text-ash">{assignment.reviewedScore ?? assignmentState?.status ?? assignment.status}</span></li>;
              })}
            </ul>
          </article>
          <article className="rounded-brand border-2 border-line bg-paper p-5">
            <div className="flex items-center gap-3"><CheckCircle2 className="text-macaw-dark" size={22} /><h2 className="text-lg font-black text-navy">Тесты</h2></div>
            <ul className="mt-4 grid gap-2">
              {courseTests.map((test) => {
                const result = localState.testResults[test.id];
                return <li className="flex items-center justify-between gap-3 rounded-brand border border-line bg-mist px-3 py-2 text-xs" key={test.id}><span className="font-black text-graphite">{test.title}</span><span className="font-bold text-ash">{result ? `${result.percent}% · ${result.passed ? "пройден" : "не пройден"}` : "Нет результата"}</span></li>;
              })}
            </ul>
          </article>
        </section>
      )}
    </div>
  );
}
