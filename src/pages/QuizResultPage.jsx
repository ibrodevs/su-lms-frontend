import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ResultSummary from "../components/ResultSummary";
import { findLesson, findSubject, getLessonsBySubject } from "../data/mockData";

export default function QuizResultPage() {
  const { subjectId, lessonId } = useParams();
  const subject = findSubject(subjectId);
  const lesson = findLesson(lessonId);

  if (!subject || !lesson || lesson.subjectId !== subject.id) {
    return <Navigate to="/subjects" replace />;
  }

  const result = JSON.parse(sessionStorage.getItem(`quiz-result-${lesson.id}`) || "null");
  if (!result) return <Navigate to={`/subjects/${subject.id}/lessons/${lesson.id}/quiz`} replace />;

  const subjectLessons = getLessonsBySubject(subject.id);
  const nextLesson = subjectLessons[subjectLessons.findIndex((item) => item.id === lesson.id) + 1];
  const passed = result.score >= lesson.passingScore;

  return (
    <main className="page-stack">
      <ResultSummary result={result} lesson={lesson} />
      <section className="result-actions">
        <Link className="secondary-action" to={`/subjects/${subject.id}/lessons/${lesson.id}`}>
          <ArrowLeft size={17} /> Вернуться к уроку
        </Link>
        {passed && nextLesson ? (
          <Link className="primary-action" to={`/subjects/${subject.id}/lessons/${nextLesson.id}`}>
            Следующий урок <ArrowRight size={17} />
          </Link>
        ) : (
          <Link className="primary-action" to={`/subjects/${subject.id}/lessons/${lesson.id}/quiz`}>
            Пройти ещё раз
          </Link>
        )}
      </section>
      <section className="panel">
        <h2>Разбор вопросов</h2>
        <div className="review-list">
          {lesson.quiz.questions.map((question, index) => {
            const userAnswer = result.answers[question.id];
            const isCorrect = userAnswer === question.correctAnswer;
            return (
              <article className={isCorrect ? "review-item correct" : "review-item wrong"} key={question.id}>
                <strong>Вопрос {index + 1}: {question.question}</strong>
                <span>Ваш ответ: {question.options[userAnswer] || "Не выбран"}</span>
                <span>Правильный ответ: {question.options[question.correctAnswer]}</span>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
