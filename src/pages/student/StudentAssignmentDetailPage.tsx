import { ArrowLeft, CheckCircle2, FileUp, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import Button from "../../components/common/Button";
import StatePanel from "../../components/student/StatePanel";
import StatusBadge from "../../components/student/StatusBadge";
import { mockAssignments } from "../../data/student/mockAssignments";
import { mockCourses } from "../../data/student/mockCourses";
import { getStudentLocalState, saveAssignmentState, type AssignmentState } from "../../services/studentStorage";
import type { AssignmentStatus } from "../../types/student";

interface RouteParams { assignmentId: string; }

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Almaty" }).format(new Date(value));
}
export default function StudentAssignmentDetailPage() {
  const { assignmentId } = useParams<RouteParams>();
  const history = useHistory();
  const assignment = mockAssignments.find((item) => item.id === assignmentId);
  const existing = assignment ? getStudentLocalState().assignments[assignment.id] : undefined;
  const [answer, setAnswer] = useState(existing?.answer ?? assignment?.draftAnswer ?? assignment?.submittedAnswer ?? "");
  const [fileName, setFileName] = useState(existing?.fileName ?? null);
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(existing?.status === "submitted" || assignment?.status === "submitted");
  const course = useMemo(() => mockCourses.find((item) => item.id === assignment?.courseId), [assignment?.courseId]);

  if (!assignment) return <StatePanel title="Задание не найдено" description="Проверьте ссылку или вернитесь к списку заданий." action={<Link className="su-button su-button--secondary" to="/student/assignments">К заданиям</Link>} />;

  const persist = (nextStatus: AssignmentStatus = submitted ? "submitted" : "in-progress") => {
    const state: AssignmentState = { status: nextStatus, answer, fileName };
    saveAssignmentState(assignment.id, state);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const submit = () => {
    if (!answer.trim()) return;
    saveAssignmentState(assignment.id, { status: "submitted", answer, fileName });
    setSubmitted(true);
  };

  return <div className="grid gap-6">
    <button className="inline-flex w-fit items-center gap-2 text-sm font-black text-ash hover:text-graphite" onClick={() => history.goBack()} type="button"><ArrowLeft size={17} /> Назад</button>
    <header className="grid gap-3"><span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">{course?.title}</span><h1 className="text-3xl font-black text-navy sm:text-4xl">{assignment.title}</h1><p className="max-w-3xl text-sm leading-6 text-ash">{assignment.description}</p></header>
    <section className="grid gap-4 rounded-brand border-2 border-line bg-paper p-5 md:grid-cols-3"><div><span className="text-xs font-bold uppercase tracking-wider text-ash">Дедлайн</span><strong className="mt-1 block text-sm text-graphite">{formatDate(assignment.dueAt)}</strong></div><div><span className="text-xs font-bold uppercase tracking-wider text-ash">Баллы</span><strong className="mt-1 block text-sm text-graphite">{assignment.maxScore}</strong></div><div><span className="text-xs font-bold uppercase tracking-wider text-ash">Статус</span><strong className="mt-2 block"><StatusBadge status={submitted ? "completed" : "in-progress"} /></strong></div></section>
    <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
      <section className="grid gap-4 rounded-brand border-2 border-line bg-paper p-5"><h2 className="text-xl font-black text-navy">Инструкция</h2><p className="whitespace-pre-line text-sm leading-7 text-graphite">{assignment.instructions}</p><label className="m-0 grid gap-2 text-sm font-black text-graphite"><span>Ваш ответ</span><textarea className="min-h-56 rounded-brand border-2 border-line p-3 text-sm font-medium outline-none focus:border-macaw disabled:bg-mist" disabled={submitted} onChange={(event) => setAnswer(event.target.value)} placeholder="Введите текст ответа" value={answer} /></label><div className="grid gap-3 sm:flex sm:flex-wrap"><label className="student-pressable inline-flex cursor-pointer items-center justify-center gap-2 rounded-brand border-2 border-line bg-paper px-4 py-3 text-sm font-black text-graphite"><FileUp size={17} /> {fileName ?? "Прикрепить файл"}<input className="sr-only" disabled={submitted} onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)} type="file" /></label><Button disabled={submitted || !answer.trim()} onClick={() => persist()} variant="secondary"><Save size={16} /> Сохранить черновик</Button><Button disabled={submitted || !answer.trim()} onClick={submit}><CheckCircle2 size={16} /> Отправить</Button></div>{saved && <p className="text-sm font-bold text-ecto-dark">Черновик сохранён локально.</p>}{submitted && <p className="text-sm font-bold text-ecto-dark">Работа отправлена. Форма заблокирована.</p>}</section>
      <aside className="grid h-fit gap-3 rounded-brand border-2 border-eel bg-ecto/10 p-5"><h2 className="text-lg font-black text-navy">Что дальше</h2><p className="text-sm leading-6 text-graphite">После отправки работа получает статус «Отправлено». Результат появится здесь после проверки преподавателем.</p><Link className="text-sm font-black text-macaw-dark underline decoration-2 underline-offset-4" to={`/student/courses/${assignment.courseId}`}>Открыть курс</Link></aside>
    </div>
  </div>;
}
