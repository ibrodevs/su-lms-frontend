import { Link } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";
import { getLessonsBySubject, subjects } from "../data/mockData";
import { getSubjectProgress } from "../utils/progress";

export default function SubjectsPage() {
  return (
    <main className="page-stack">
      <div className="page-title">
        <span className="eyebrow">Каталог</span>
        <h1>Предметы</h1>
        <p>Каждый предмет содержит уроки, материалы, видео и тесты после урока.</p>
      </div>
      <section className="grid subjects-grid">
        {subjects.map((subject) => {
          const subjectLessons = getLessonsBySubject(subject.id);
          const progress = getSubjectProgress(subjectLessons);
          return (
            <article className="subject-card rich" key={subject.id}>
              <img src={subject.image} alt="" />
              <div className="subject-topline">
                <span className="subject-icon" style={{ background: subject.accent }}>{subject.icon}</span>
                <span><Users size={16} /> {subject.teacher}</span>
              </div>
              <h2>{subject.title}</h2>
              <p>{subject.description}</p>
              <div className="progress-row">
                <strong>Прогресс: {progress.percent}%</strong>
                <span>{progress.completed} / {progress.total}</span>
              </div>
              <div className="progress-line">
                <span style={{ width: `${progress.percent}%`, background: subject.accent }} />
              </div>
              <Link className="secondary-action" to={`/subjects/${subject.id}`}>
                Открыть предмет <ArrowRight size={17} />
              </Link>
            </article>
          );
        })}
      </section>
    </main>
  );
}
