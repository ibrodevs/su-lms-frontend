import { CheckCircle2, XCircle } from "lucide-react";

export default function ResultSummary({ result, lesson }) {
  const passed = result.score >= lesson.passingScore;

  return (
    <section className={passed ? "result-card passed" : "result-card failed"}>
      <div className="result-icon">
        {passed ? <CheckCircle2 size={36} /> : <XCircle size={36} />}
      </div>
      <div>
        <span className="eyebrow">Ваш результат</span>
        <h1>{result.score}%</h1>
        <p>{passed ? "Урок успешно сдан" : "Урок не сдан"}</p>
      </div>
      <div className="result-stats">
        <span>Правильных ответов: <strong>{result.correct} из {result.total}</strong></span>
        <span>Проходной балл: <strong>{lesson.passingScore}%</strong></span>
      </div>
    </section>
  );
}
