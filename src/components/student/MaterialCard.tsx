import {
  ExternalLink,
  FileAudio,
  FileImage,
  FileQuestion,
  FileText,
  Library,
  Presentation,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Material } from "../../types/student";

const icons = {
  pdf: FileText,
  docx: FileText,
  pptx: Presentation,
  audio: FileAudio,
  image: FileImage,
  external: ExternalLink,
  library: Library,
  other: FileQuestion,
} satisfies Record<Material["type"], typeof FileText>;

const labels: Record<Material["type"], string> = {
  pdf: "PDF",
  docx: "DOCX",
  pptx: "PPTX",
  audio: "Аудио",
  image: "Изображение",
  external: "Внешняя ссылка",
  library: "Библиотека",
  other: "Другой формат",
};

interface MaterialCardProps {
  material: Material;
}

export default function MaterialCard({ material }: MaterialCardProps) {
  const Icon = icons[material.type];
  const isAvailable = material.availability === "available";

  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-brand border-2 border-line bg-paper p-4 sm:flex-row sm:items-center">
      <span className="grid size-12 shrink-0 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-macaw-dark">
        <Icon aria-hidden="true" size={23} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-macaw-dark">
            {labels[material.type]}
          </span>
          {material.size && (
            <span className="text-[11px] font-bold text-ash">
              · {material.size}
            </span>
          )}
        </div>
        <h3 className="mt-1 truncate text-sm font-black text-navy">
          {material.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-ash">
          {material.description}
        </p>
      </div>
      <Link
        className="student-pressable inline-flex min-h-10 shrink-0 items-center justify-center rounded-brand border-2 border-lingot bg-paper px-4 py-2 text-xs font-black text-ecto-dark"
        to={`/student/materials/${material.id}`}
      >
        {isAvailable ? "Открыть" : "Подробнее"}
      </Link>
    </article>
  );
}
