import { Link } from "react-router-dom";
import { ArrowRight, ListChecks } from "lucide-react";
import { findSubject, lessons } from "../data/mockData";
import { getLessonProgress, getStatusLabel } from "../utils/progress";

export default function QuickTestsPage() {
  return (
    <main className="page-stack">
      <div className="page-title">
        <span className="eyebrow">Быстрый доступ</span>
        <h1>Тесты после уроков</h1>
        <p>Тесты связаны с конкретными уроками и обновляют прогресс предмета.</p>
      </div>
      <section className="quick-tests">
        {lessons.map((lesson) => {
          const subject = findSubject(lesson.subjectId);
          const progress = getLessonProgress(lesson.id);
          return (
            <article className="quick-test-card" key={lesson.id}>
              <div className="material-icon"><ListChecks size={22} /></div>
              <div>
                <span className="eyebrow">{subject.title}</span>
                <h2>Тест к уроку: {lesson.title}</h2>
                <p>Проходной балл: {lesson.passingScore}% · Статус: {getStatusLabel(progress)}</p>
                {progress?.bestScore > 0 && <p>Лучший результат: {progress.bestScore}%</p>}
              </div>
              <div className="quick-actions">
                <Link className="secondary-action compact" to={`/subjects/${subject.id}/lessons/${lesson.id}`}>
                  Открыть урок
                </Link>
                <Link className="primary-action compact" to={`/subjects/${subject.id}/lessons/${lesson.id}/quiz`}>
                  Пройти тест <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
