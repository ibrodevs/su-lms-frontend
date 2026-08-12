import type { StaffMaterialType } from "../types/staff";

export const staffMaterialTypeLabels: Record<StaffMaterialType, string> = {
  pdf: "PDF",
  docx: "DOCX",
  pptx: "PPTX",
  image: "Изображение",
  audio: "Аудио",
  video: "Видео",
  external: "Внешняя ссылка",
  library: "Электронная библиотека",
};

export function formatFileSize(sizeBytes?: number): string {
  if (!sizeBytes) return "—";
  if (sizeBytes < 1024) return `${sizeBytes} Б`;
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} КБ`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function getMaterialDomain(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url, window.location.origin).hostname || "SU LMS";
  } catch {
    return "Некорректная ссылка";
  }
}
