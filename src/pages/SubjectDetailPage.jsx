import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LessonCard from "../components/LessonCard";
import { findSubject, getLessonsBySubject } from "../data/mockData";
import { getLessonProgress, getSubjectProgress } from "../utils/progress";

export default function SubjectDetailPage() {
  const { subjectId } = useParams();
  const subject = findSubject(subjectId);
  if (!subject) return <Navigate to="/subjects" replace />;

  const subjectLessons = getLessonsBySubject(subjectId);
  const progress = getSubjectProgress(subjectLessons);

  return (
    <main className="page-stack">
      <Link className="back-link" to="/subjects"><ArrowLeft size={17} /> Назад к предметам</Link>
      <section className="subject-hero">
        <img src={subject.image} alt="" />
        <div>
          <span className="eyebrow">{subject.teacher}</span>
          <h1>{subject.title}</h1>
          <p>{subject.description}</p>
          <div className="progress-row">
            <strong>Прогресс: {progress.percent}%</strong>
            <span>Сдано уроков: {progress.completed} из {progress.total}</span>
          </div>
          <div className="progress-line large">
            <span style={{ width: `${progress.percent}%`, background: subject.accent }} />
          </div>
        </div>
      </section>
      <section className="lesson-list">
        {subjectLessons.map((lesson, index) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            subject={subject}
            index={index}
            progress={getLessonProgress(lesson.id)}
          />
        ))}
      </section>
    </main>
  );
}
