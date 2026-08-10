import { ArrowLeft, ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import Button from "../../components/common/Button";
import StatePanel from "../../components/student/StatePanel";
import { mockCourses } from "../../data/student/mockCourses";
import { mockTests } from "../../data/student/mockTests";
import { saveTestResult } from "../../services/studentStorage";
import type { TestQuestion } from "../../types/student";

interface RouteParams { testId: string; }

export default function StudentTestRunPage() {
  const { testId } = useParams<RouteParams>();
  const history = useHistory();
  const test = mockTests.find((item) => item.id === testId);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [secondsLeft, setSecondsLeft] = useState((test?.durationMinutes ?? 1) * 60);
  const question: TestQuestion | undefined = test?.questions[index];
  const course = useMemo(() => mockCourses.find((item) => item.id === test?.courseId), [test?.courseId]);

  const finish = useCallback(() => {
    if (!test || test.questions.length === 0) return;

    const correct = test.questions.reduce((total, item) => {
      const submitted = answers[item.id];
      if (item.type === "text") return total + (typeof submitted === "string" && submitted.trim().toLowerCase() === item.correctText?.toLowerCase() ? 1 : 0);
      const expected = item.correctOptionIds ?? [];
      const actual = Array.isArray(submitted) ? submitted : submitted ? [submitted] : [];
      return total + (expected.length === actual.length && expected.every((id) => actual.includes(id)) ? 1 : 0);
    }, 0);
    const percent = Math.round((correct / test.questions.length) * 100);
    saveTestResult({ testId: test.id, score: correct, percent, passed: percent >= test.passingScore, completedAt: new Date().toISOString(), answers });
    history.replace(`/student/tests/${test.id}/result`);
  }, [answers, history, test]);

  useEffect(() => {
    if (!test || test.status === "locked" || secondsLeft <= 0) return undefined;
    const timer = window.setTimeout(
      () => setSecondsLeft((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [secondsLeft, test]);

  useEffect(() => {
    if (test && test.status !== "locked" && secondsLeft === 0) finish();
  }, [finish, secondsLeft, test]);

  if (!test || !question) return <StatePanel title="Тест не найден" description="Вернитесь к списку тестов и выберите доступный тест." action={<Link className="su-button su-button--secondary" to="/student/tests">К тестам</Link>} />;
  if (test.status === "locked") return <StatePanel title="Тест заблокирован" description="Завершите необходимые уроки курса, чтобы получить доступ к тесту." action={<Link className="su-button su-button--secondary" to="/student/tests">К тестам</Link>} />;

  const answer = answers[question.id];
  const setAnswer = (value: string | string[]) => setAnswers((current) => ({ ...current, [question.id]: value }));

  return <div className="mx-auto grid max-w-3xl gap-6"><div className="flex flex-wrap items-center justify-between gap-3"><Link className="inline-flex items-center gap-2 text-sm font-black text-ash hover:text-graphite" to="/student/tests"><ArrowLeft size={17} /> К тестам</Link><span className="inline-flex items-center gap-2 rounded-brand border-2 border-line px-3 py-2 text-sm font-black text-graphite"><Clock3 size={16} /> {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}</span></div><header><span className="text-xs font-black uppercase tracking-[0.12em] text-ecto-dark">{course?.title}</span><h1 className="mt-2 text-3xl font-black text-navy">{test.title}</h1><div className="mt-4 h-3 overflow-hidden rounded-full bg-mist"><span className="block h-full bg-ecto" style={{ width: `${((index + 1) / test.questions.length) * 100}%` }} /></div><p className="mt-2 text-xs font-bold text-ash">Вопрос {index + 1} из {test.questions.length}</p></header><section className="grid gap-5 rounded-brand border-2 border-line bg-paper p-6"><h2 className="text-2xl font-black text-navy">{question.prompt}</h2>{question.type === "text" ? <input aria-label="Текстовый ответ" className="rounded-brand border-2 border-line px-4 py-3 outline-none focus:border-macaw" onChange={(event) => setAnswer(event.target.value)} value={typeof answer === "string" ? answer : ""} /> : <div className="grid gap-3">{(question.options ?? []).map((option, optionIndex) => { const optionId = String(optionIndex); const selected = Array.isArray(answer) ? answer.includes(optionId) : answer === optionId; return <label className={`flex cursor-pointer items-center gap-3 rounded-brand border-2 p-4 text-sm font-bold ${selected ? "border-macaw bg-macaw/10 text-macaw-dark" : "border-line bg-paper text-graphite"}`} key={optionId}><input checked={selected} className="sr-only" name={question.id} onChange={() => question.type === "multiple" ? setAnswer(selected ? (Array.isArray(answer) ? answer.filter((id) => id !== optionId) : []) : [...(Array.isArray(answer) ? answer : []), optionId]) : setAnswer(optionId)} type={question.type === "multiple" ? "checkbox" : "radio"} /> <span className="grid size-7 place-items-center rounded-full border-2 border-current text-xs">{optionIndex + 1}</span>{option}</label>; })}</div>}<div className="flex flex-col-reverse justify-between gap-3 sm:flex-row"><Button disabled={index === 0} onClick={() => setIndex((value) => value - 1)} variant="secondary"><ArrowLeft size={16} /> Назад</Button>{index === test.questions.length - 1 ? <Button onClick={finish}><CheckCircle2 size={16} /> Завершить тест</Button> : <Button onClick={() => setIndex((value) => value + 1)}>Следующий вопрос <ArrowRight size={16} /></Button>}</div></section></div>;
}
