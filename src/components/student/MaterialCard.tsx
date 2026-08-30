import { ExternalLink, FileAudio, FileImage, FileQuestion, FileText, FileVideo, Library, Presentation } from "lucide-react";
import { Link } from "react-router-dom";
import type { LearningMaterialType } from "../../api/learning.api";
import type { StudentMaterialDto } from "../../api/student.api";
import { formatFileSize } from "../../utils/studentLearning";

const icons = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  ppt: Presentation,
  pptx: Presentation,
  image: FileImage,
  audio: FileAudio,
  video: FileVideo,
  external_link: ExternalLink,
  library_link: Library,
  other: FileQuestion,
} satisfies Record<LearningMaterialType, typeof FileText>;

const labels: Record<LearningMaterialType, string> = {
  pdf: "PDF",
  doc: "DOC",
  docx: "DOCX",
  ppt: "PPT",
  pptx: "PPTX",
  image: "Изображение",
  audio: "Аудио",
  video: "Видео",
  external_link: "Внешняя ссылка",
  library_link: "Библиотека",
  other: "Другой формат",
};

interface MaterialCardProps {
  courseId: number;
  lessonId: number;
  material: StudentMaterialDto;
}

export default function MaterialCard({ courseId, lessonId, material }: MaterialCardProps) {
  const Icon = icons[material.type];
  const size = formatFileSize(material.size);
  const query = new URLSearchParams({ courseId: String(courseId), lessonId: String(lessonId) });
  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-brand border-2 border-line bg-paper p-4 sm:flex-row sm:items-center">
      <span className="grid size-12 shrink-0 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-macaw-dark"><Icon aria-hidden="true" size={23} /></span>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[0.14em] text-macaw-dark">{labels[material.type]}</span>{size ? <span className="text-[11px] font-bold text-ash">· {size}</span> : null}</div><h3 className="mt-1 truncate text-sm font-black text-navy">{material.title}</h3>{material.description ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-ash">{material.description}</p> : null}</div>
      <Link className="student-pressable inline-flex min-h-10 shrink-0 items-center justify-center rounded-brand border-2 border-lingot bg-paper px-4 py-2 text-xs font-black text-ecto-dark" to={`/student/materials/${material.id}?${query.toString()}`}>Открыть</Link>
    </article>
  );
}
