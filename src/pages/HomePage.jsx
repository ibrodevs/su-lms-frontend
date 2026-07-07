import { Link } from "react-router-dom";
import { BookOpen, FileText, PlayCircle, Trophy } from "lucide-react";
import { getLessonsBySubject, lessons, subjects } from "../data/mockData";
import { getSubjectProgress } from "../utils/progress";

export default function HomePage() {
  const totalLessons = lessons.length;
  const completed = lessons.filter((lesson) => getSubjectProgress([lesson]).completed === 1).length;

  return (
    <main className="page-stack">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">Презентационная демо-версия</span>
          <h1>Полный учебный сценарий Bilim Ordo</h1>
          <p>
            Студент открывает предмет, проходит урок с YouTube-видео, читает PDF-материалы,
            сдаёт тест и видит обновлённый прогресс.
          </p>
          <Link className="primary-action inline" to="/subjects">Перейти к предметам</Link>
        </div>
        <div className="hero-stats">
          <span><BookOpen /> {subjects.length} предмета</span>
          <span><PlayCircle /> {totalLessons} видеоуроков</span>
          <span><FileText /> PDF материалы</span>
          <span><Trophy /> {completed} уроков сдано</span>
        </div>
      </section>

      <section className="grid subjects-grid">
        {subjects.map((subject) => {
          const subjectLessons = getLessonsBySubject(subject.id);
          const progress = getSubjectProgress(subjectLessons);
          return (
            <Link className="subject-card" key={subject.id} to={`/subjects/${subject.id}`}>
              <img src={subject.image} alt="" />
              <div>
                <h2>{subject.title}</h2>
                <p>{subject.description}</p>
              </div>
              <div className="progress-line">
                <span style={{ width: `${progress.percent}%`, background: subject.accent }} />
              </div>
              <small>Сдано уроков: {progress.completed} из {progress.total}</small>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
