import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { findLesson, findMaterial, findSubject } from "../data/mockData";

export default function MaterialReaderPage() {
  const { subjectId, lessonId, materialId } = useParams();
  const subject = findSubject(subjectId);
  const lesson = findLesson(lessonId);
  const material = findMaterial(materialId);

  if (!subject || !lesson || !material || lesson.subjectId !== subject.id) {
    return <Navigate to="/subjects" replace />;
  }

  return (
    <main className="page-stack">
      <Link className="back-link" to={`/subjects/${subject.id}/lessons/${lesson.id}`}>
        <ArrowLeft size={17} /> Назад к уроку
      </Link>
      <section className="reader-head">
        <div className="material-icon"><FileText size={24} /></div>
        <div>
          <span className="eyebrow">{lesson.title}</span>
          <h1>{material.title}</h1>
        </div>
      </section>
      <iframe className="pdf-viewer" src={material.url} title={material.title} />
    </main>
  );
}
