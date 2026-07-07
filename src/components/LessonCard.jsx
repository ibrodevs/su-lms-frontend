import { Link } from "react-router-dom";
import { FileText, HelpCircle, Timer } from "lucide-react";
import ProgressBadge from "./ProgressBadge";

export default function LessonCard({ lesson, subject, progress, index }) {
  const isCompleted = progress?.status === "completed";

  return (
    <article className="lesson-card">
      <div className="lesson-card-head">
        <span className="lesson-index">Урок {index + 1}</span>
        <ProgressBadge progress={progress} />
      </div>
      <h3>{lesson.title}</h3>
      <p>{lesson.description}</p>
      <div className="lesson-meta">
        <span><Timer size={15} /> {lesson.duration}</span>
        <span><FileText size={15} /> {lesson.materials.length} материал</span>
        <span><HelpCircle size={15} /> {lesson.quiz.questions.length} вопросов</span>
      </div>
      {progress?.bestScore > 0 && (
        <div className="best-score">
          Лучший результат: <strong>{progress.bestScore}%</strong>
        </div>
      )}
      <Link className={isCompleted ? "secondary-action" : "primary-action"} to={`/subjects/${subject.id}/lessons/${lesson.id}`}>
        {isCompleted ? "Повторить урок" : "Открыть урок"}
      </Link>
    </article>
  );
}
