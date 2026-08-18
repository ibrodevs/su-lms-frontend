import type { LearningMaterialType } from "../api/learning.api";

export const learningMaterialTypeLabels: Record<LearningMaterialType, string> = {
  pdf: "PDF",
  doc: "DOC",
  docx: "DOCX",
  ppt: "PPT",
  pptx: "PPTX",
  image: "Изображение",
  audio: "Аудио",
  video: "Видео",
  external_link: "Внешняя ссылка",
  library_link: "Электронная библиотека",
  other: "Другой файл",
};

export function formatLearningFileSize(size: number | null): string {
  if (!size) return "—";
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
