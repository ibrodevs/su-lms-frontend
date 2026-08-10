import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeading from "../../components/student/PageHeading";
import StatePanel from "../../components/student/StatePanel";
import { mockAssignments } from "../../data/student/mockAssignments";
import { mockCourses } from "../../data/student/mockCourses";
import { useMockLoading } from "../../hooks/useMockLoading";
import { getStudentLocalState } from "../../services/studentStorage";
import type { Assignment, AssignmentStatus } from "../../types/student";

const labels: Record<AssignmentStatus, string> = {
  "not-started": "Не начато",
  "in-progress": "В процессе",
  submitted: "Отправлено",
  reviewed: "Проверено",
  overdue: "Просрочено",
};

const statusClasses: Record<AssignmentStatus, string> = {
  "not-started": "border-line bg-mist text-ash",
  "in-progress": "border-macaw/30 bg-macaw/10 text-macaw-dark",
  submitted: "border-ecto/30 bg-ecto/10 text-ecto-dark",
  reviewed: "border-ecto/30 bg-ecto/10 text-ecto-dark",
  overdue: "border-danger/30 bg-danger/10 text-danger",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Almaty",
  }).format(new Date(value));
}

function getEffectiveStatus(
  assignment: Assignment,
  persistedStatus?: AssignmentStatus,
): AssignmentStatus {
  const status = persistedStatus ?? assignment.status;
  const isFinished = status === "submitted" || status === "reviewed";
  return !isFinished && new Date(assignment.dueAt) < new Date()
    ? "overdue"
    : status;
}

export default function StudentAssignmentsPage() {
  const isLoading = useMockLoading();
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("all");
  const [status, setStatus] = useState("all");
  const [assignmentStates] = useState(
    () => getStudentLocalState().assignments,
  );
  const filtered = useMemo(() => mockAssignments.filter((assignment) => {
    const course = mockCourses.find((item) => item.id === assignment.courseId);
    const matchesQuery = `${assignment.title} ${course?.title ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const effectiveStatus = getEffectiveStatus(
      assignment,
      assignmentStates[assignment.id]?.status,
    );
    return matchesQuery && (courseId === "all" || assignment.courseId === courseId) && (status === "all" || effectiveStatus === status);
  }), [assignmentStates, courseId, query, status]);

  if (isLoading) return <StatePanel kind="loading" title="Загружаем задания" description="Подготавливаем дедлайны и статусы работ." />;

  return (
    <div className="grid gap-6">
      <PageHeading eyebrow="Учебная активность" title="Задания" description="Контролируйте дедлайны, черновики и отправленные работы." />
      <section className="grid gap-3 rounded-brand border-2 border-line bg-paper p-4 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative m-0 block">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" size={18} />
          <input aria-label="Поиск заданий" className="w-full rounded-brand border-2 border-line bg-paper py-3 pl-10 pr-3 text-sm outline-none focus:border-macaw" onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по заданиям" value={query} />
        </label>
        <select aria-label="Фильтр курса" className="rounded-brand border-2 border-line bg-paper px-3 py-3 text-sm font-bold text-graphite" onChange={(event) => setCourseId(event.target.value)} value={courseId}>
          <option value="all">Все курсы</option>
          {mockCourses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
        </select>
        <select aria-label="Фильтр статуса" className="rounded-brand border-2 border-line bg-paper px-3 py-3 text-sm font-bold text-graphite" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="all">Все статусы</option>
          {Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </section>
      {filtered.length === 0 ? <StatePanel title="Заданий не найдено" description="Измените фильтры или поисковый запрос." icon={SlidersHorizontal} /> : (
        <section className="grid gap-3">
          {filtered.map((assignment) => {
            const course = mockCourses.find((item) => item.id === assignment.courseId);
            const effectiveStatus = getEffectiveStatus(
              assignment,
              assignmentStates[assignment.id]?.status,
            );
            return <article className="grid gap-4 rounded-brand border-2 border-line bg-paper p-5 md:grid-cols-[1fr_auto]" key={assignment.id}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black uppercase tracking-[0.12em] text-ecto-dark">{course?.code}</span><span className={`rounded-brand border-2 px-2 py-1 text-[11px] font-black ${statusClasses[effectiveStatus]}`}>{labels[effectiveStatus]}</span></div>
                <h2 className="mt-2 text-xl font-black text-navy">{assignment.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ash">{assignment.description}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-ash"><span>Дедлайн: {formatDate(assignment.dueAt)}</span><span>Максимум: {assignment.maxScore} баллов</span></div>
              </div>
              <div className="flex items-center md:self-center"><Link className="student-pressable inline-flex w-full justify-center rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-3 text-sm font-black text-white md:w-auto" to={`/student/assignments/${assignment.id}`}>Открыть</Link></div>
            </article>;
          })}
        </section>
      )}
    </div>
  );
}
