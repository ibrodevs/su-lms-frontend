import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

export default function MaterialCard({ subjectId, lessonId, material }) {
  return (
    <article className="material-card">
      <div className="material-icon"><FileText size={22} /></div>
      <div>
        <span className="feature-badge light">PDF материал</span>
        <h3>{material.title}</h3>
      </div>
      <Link
        className="secondary-action compact"
        to={`/subjects/${subjectId}/lessons/${lessonId}/materials/${material.id}`}
      >
        Прочитать
      </Link>
    </article>
  );
}
