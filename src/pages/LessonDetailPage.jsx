import ReactMarkdown from "react-markdown";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckSquare, FileText, ListChecks, Timer } from "lucide-react";
import MaterialCard from "../components/MaterialCard";
import ProgressBadge from "../components/ProgressBadge";
import VideoPlayer from "../components/VideoPlayer";
import { findLesson, findSubject } from "../data/mockData";
import { getLessonProgress, markLessonStarted } from "../utils/progress";

export default function LessonDetailPage() {
  const { subjectId, lessonId } = useParams();
  const subject = findSubject(subjectId);
  const lesson = findLesson(lessonId);

  if (!subject || !lesson || lesson.subjectId !== subject.id) {
    return <Navigate to="/subjects" replace />;
  }

  markLessonStarted(lesson.id);
  const progress = getLessonProgress(lesson.id);

  return (
    <main className="page-stack lesson-detail">
      <Link className="back-link" to={`/subjects/${subject.id}`}>
        <ArrowLeft size={17} /> Назад к предмету
      </Link>

      <section className="lesson-hero">
        <div>
          <span className="eyebrow">{subject.title}</span>
          <h1>{lesson.title}</h1>
          <p>{lesson.description}</p>
          <div className="lesson-meta wrap">
            <span><Timer size={16} /> {lesson.duration}</span>
            <span><FileText size={16} /> {lesson.materials.length} материал</span>
            <span><ListChecks size={16} /> {lesson.quiz.questions.length} вопросов</span>
            <span><CheckSquare size={16} /> Проходной балл {lesson.passingScore}%</span>
          </div>
        </div>
        <ProgressBadge progress={progress} />
      </section>

      <VideoPlayer lesson={lesson} />

      <section className="two-column">
        <article className="panel markdown-panel">
          <span className="feature-badge">Конспект урока</span>
          <ReactMarkdown>{lesson.content}</ReactMarkdown>
        </article>
        <aside className="panel">
          <span className="feature-badge light">Темы урока</span>
          <ul className="topic-list">
            {lesson.topics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="feature-badge">PDF материал</span>
            <h2>Материалы урока</h2>
          </div>
        </div>
        {lesson.materials.length ? (
          <div className="materials-grid">
            {lesson.materials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                subjectId={subject.id}
                lessonId={lesson.id}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">Материалы для этого урока пока не добавлены.</div>
        )}
      </section>

      <section className="quiz-cta">
        <div>
          <span className="feature-badge">Тест после урока</span>
          <h2>Проверь себя</h2>
          <p>
            Чтобы урок был засчитан, нужно набрать минимум {lesson.passingScore}%.
            Лучший результат сохраняется после обновления страницы.
          </p>
        </div>
        <Link className="primary-action" to={`/subjects/${subject.id}/lessons/${lesson.id}/quiz`}>
          {progress?.bestScore ? "Пройти ещё раз" : "Начать тест"}
        </Link>
      </section>
    </main>
  );
}
