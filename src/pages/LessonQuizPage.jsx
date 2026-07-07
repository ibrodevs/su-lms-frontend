import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import QuizQuestion from "../components/QuizQuestion";
import { findLesson, findSubject } from "../data/mockData";
import { saveLessonResult } from "../utils/progress";

export default function LessonQuizPage() {
  const { subjectId, lessonId } = useParams();
  const navigate = useNavigate();
  const subject = findSubject(subjectId);
  const lesson = findLesson(lessonId);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  if (!subject || !lesson || lesson.subjectId !== subject.id) {
    return <Navigate to="/subjects" replace />;
  }

  const question = lesson.quiz.questions[index];
  const selected = answers[question.id];
  const isLast = index === lesson.quiz.questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / lesson.quiz.questions.length) * 100);

  const canContinue = selected !== undefined;

  const finish = () => {
    const correct = lesson.quiz.questions.filter((item) => answers[item.id] === item.correctAnswer).length;
    const total = lesson.quiz.questions.length;
    const score = Math.round((correct / total) * 100);
    saveLessonResult(lesson, score);
    sessionStorage.setItem(
      `quiz-result-${lesson.id}`,
      JSON.stringify({
        score,
        correct,
        total,
        answers,
        completedAt: new Date().toISOString(),
      })
    );
    navigate(`/subjects/${subject.id}/lessons/${lesson.id}/quiz/result`);
  };

  const title = useMemo(() => `${lesson.quiz.title} · ${lesson.title}`, [lesson]);

  return (
    <main className="quiz-page">
      <Link className="back-link" to={`/subjects/${subject.id}/lessons/${lesson.id}`}>
        <ArrowLeft size={17} /> Вернуться к уроку
      </Link>
      <section className="quiz-shell">
        <div className="quiz-head">
          <span className="eyebrow">{title}</span>
          <h1>Вопрос {index + 1} из {lesson.quiz.questions.length}</h1>
          <p>Проходной балл: {lesson.passingScore}%</p>
          <div className="progress-line">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
        <QuizQuestion
          question={question}
          selected={selected}
          onSelect={(optionIndex) => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
        />
        <div className="quiz-actions">
          <button
            className="secondary-action"
            type="button"
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            disabled={index === 0}
          >
            Назад
          </button>
          <button
            className="primary-action"
            type="button"
            disabled={!canContinue}
            onClick={() => (isLast ? finish() : setIndex((current) => current + 1))}
          >
            {isLast ? "Завершить тест" : "Следующий вопрос"}
          </button>
        </div>
      </section>
    </main>
  );
}
