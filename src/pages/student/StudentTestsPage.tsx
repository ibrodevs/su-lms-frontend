import { Clock3, LockKeyhole, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeading from "../../components/student/PageHeading";
import StatePanel from "../../components/student/StatePanel";
import { mockCourses } from "../../data/student/mockCourses";
import { mockTests } from "../../data/student/mockTests";
import { useMockLoading } from "../../hooks/useMockLoading";
import { getStudentLocalState } from "../../services/studentStorage";
import type { TestStatus } from "../../types/student";

const labels: Record<TestStatus, string> = { available: "Доступен", "in-progress": "В процессе", passed: "Пройден", failed: "Не пройден", locked: "Заблокирован" };
const classes: Record<TestStatus, string> = { available: "border-macaw/30 bg-macaw/10 text-macaw-dark", "in-progress": "border-warning/30 bg-warning/10 text-warning", passed: "border-ecto/30 bg-ecto/10 text-ecto-dark", failed: "border-danger/30 bg-danger/10 text-danger", locked: "border-line bg-mist text-ash" };

export default function StudentTestsPage() {
  const isLoading = useMockLoading();
  const state = getStudentLocalState();
  if (isLoading) return <StatePanel kind="loading" title="Загружаем тесты" description="Подготавливаем доступные попытки и результаты." />;
  return <div className="grid gap-6"><PageHeading eyebrow="Проверка знаний" title="Тесты" description="Проходите тесты по курсам и сохраняйте результаты локально." />{mockTests.length === 0 ? <StatePanel title="Тестов пока нет" description="Когда тесты будут опубликованы, они появятся здесь." /> : <section className="grid gap-3">{mockTests.map((test) => { const course = mockCourses.find((item) => item.id === test.courseId); const result = state.testResults[test.id]; const status = result ? (result.passed ? "passed" : "failed") : test.status; return <article className="grid gap-4 rounded-brand border-2 border-line bg-paper p-5 md:grid-cols-[1fr_auto]" key={test.id}><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black uppercase tracking-[0.12em] text-ecto-dark">{course?.code}</span><span className={`rounded-brand border-2 px-2 py-1 text-[11px] font-black ${classes[status]}`}>{labels[status]}</span></div><h2 className="mt-2 text-xl font-black text-navy">{test.title}</h2><p className="mt-2 text-sm leading-6 text-ash">{test.description}</p><div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-ash"><span className="inline-flex items-center gap-1"><Clock3 size={14} /> {test.durationMinutes} минут</span><span>{test.questions.length} вопросов</span><span>Проходной балл {test.passingScore}%</span></div></div><div className="flex items-center">{status === "locked" ? <span className="inline-flex items-center gap-2 text-sm font-black text-ash"><LockKeyhole size={17} /> Заблокирован</span> : <Link className="student-pressable inline-flex w-full items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-3 text-sm font-black text-white md:w-auto" to={`/student/tests/${test.id}`}>{result ? "Пройти ещё раз" : "Начать тест"}<PlayCircle size={17} /></Link>}</div></article>; })}</section>}</div>;
}
