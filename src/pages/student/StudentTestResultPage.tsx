import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import StatePanel from "../../components/student/StatePanel";
import { mockCourses } from "../../data/student/mockCourses";
import { mockTests } from "../../data/student/mockTests";
import { getStudentLocalState } from "../../services/studentStorage";

interface RouteParams { testId: string; }

export default function StudentTestResultPage() {
  const { testId } = useParams<RouteParams>();
  const test = mockTests.find((item) => item.id === testId);
  const result = getStudentLocalState().testResults[testId];
  if (!test || !result) return <StatePanel title="Результат не найден" description="Сначала пройдите тест, чтобы увидеть результат." action={<Link className="su-button su-button--secondary" to="/student/tests">К тестам</Link>} />;
  const course = mockCourses.find((item) => item.id === test.courseId);
  return <div className="mx-auto grid max-w-2xl gap-6 text-center"><header><span className="text-xs font-black uppercase tracking-[0.12em] text-ecto-dark">{course?.title}</span><h1 className="mt-2 text-3xl font-black text-navy">Результат теста</h1></header><section className="grid justify-items-center gap-4 rounded-brand border-2 border-line bg-paper p-8"><span className={`grid size-20 place-items-center rounded-full border-2 ${result.passed ? "border-ecto bg-ecto/10 text-ecto-dark" : "border-danger bg-danger/10 text-danger"}`}>{result.passed ? <CheckCircle2 size={42} /> : <XCircle size={42} />}</span><p className="text-6xl font-black text-navy">{result.percent}%</p><h2 className="text-xl font-black text-graphite">{result.passed ? "Тест пройден" : "Нужно повторить материал"}</h2><p className="max-w-md text-sm leading-6 text-ash">Правильных ответов: {result.score} из {test.questions.length}. Проходной балл — {test.passingScore}%.</p><div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center"><Link className="su-button su-button--secondary inline-flex items-center justify-center gap-2" to="/student/tests"><RotateCcw size={16} /> К списку тестов</Link><Link className="su-button su-button--primary inline-flex items-center justify-center gap-2" to={`/student/tests/${test.id}`}><RotateCcw size={16} /> Пройти ещё раз</Link></div></section></div>;
}
