import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, ExternalLink, FileAudio, FileImage, FileQuestion, FileText, FileVideo, Library, Presentation } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import type { LearningMaterialType } from "../../api/learning.api";
import { resolveApiResourceUrl } from "../../api/learning.api";
import { studentApi } from "../../api/student.api";
import { studentKeys } from "../../api/studentKeys";
import StatePanel from "../../components/student/StatePanel";
import { formatFileSize } from "../../utils/studentLearning";

interface MaterialRouteParams {
  materialId: string;
}

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

const typeLabels: Record<LearningMaterialType, string> = {
  pdf: "PDF-документ",
  doc: "Документ DOC",
  docx: "Документ DOCX",
  ppt: "Презентация PPT",
  pptx: "Презентация PPTX",
  image: "Изображение",
  audio: "Аудиоматериал",
  video: "Видеоматериал",
  external_link: "Внешний ресурс",
  library_link: "Электронная библиотека",
  other: "Другой формат",
};

export default function StudentMaterialPage() {
  const { materialId: materialIdParam } = useParams<MaterialRouteParams>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const materialId = Number(materialIdParam);
  const lessonId = Number(searchParams.get("lessonId"));
  const courseId = Number(searchParams.get("courseId"));
  const hasValidContext = [materialId, lessonId, courseId].every((value) => Number.isInteger(value) && value > 0);
  const lessonQuery = useQuery({ enabled: hasValidContext, queryKey: studentKeys.lesson(lessonId), queryFn: () => studentApi.lesson(lessonId) });
  const material = lessonQuery.data?.materials.find((item) => item.id === materialId);
  const downloadMutation = useMutation({
    mutationFn: async () => {
      if (!material) throw new Error("Материал не найден.");
      return studentApi.downloadMaterial(material.id);
    },
    onSuccess: (blob) => {
      if (!material) return;
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = material.original_filename || `${material.title}.${material.extension || "file"}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    },
  });

  if (!hasValidContext) return <MaterialError description="Для безопасного открытия материала нужен контекст курса и урока." />;
  if (lessonQuery.isPending) return <StatePanel description="Проверяем доступ к уроку и получаем материал с backend." kind="loading" title="Загрузка материала" />;
  if (lessonQuery.isError) return <MaterialError description={lessonQuery.error.message} />;
  if (!material) return <MaterialError description="Материал отсутствует среди доступных материалов этого урока." />;

  const Icon = icons[material.type];
  const size = formatFileSize(material.size);
  const backUrl = `/student/courses/${courseId}/lessons/${lessonId}`;
  const isExternal = material.type === "external_link" || material.type === "library_link";
  const playbackUrl = material.playback_url ? resolveApiResourceUrl(material.playback_url) : null;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <Link className="inline-flex w-fit items-center gap-2 text-xs font-black text-macaw-dark hover:underline" to={backUrl}><ArrowLeft aria-hidden="true" size={16} />Вернуться к уроку</Link>

      <header className="flex flex-col justify-between gap-5 rounded-brand border-2 border-line p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex min-w-0 items-start gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-macaw-dark"><Icon aria-hidden="true" size={27} /></span><div className="min-w-0"><span className="text-[10px] font-black uppercase tracking-[0.14em] text-macaw-dark">{typeLabels[material.type]}</span><h1 className="mt-1 text-2xl font-black text-navy sm:text-3xl">{material.title}</h1>{material.description ? <p className="mt-2 text-sm leading-6 text-ash">{material.description}</p> : null}<div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-ash">{material.original_filename ? <span>{material.original_filename}</span> : null}{size ? <span>{size}</span> : null}{material.duration_seconds ? <span>{Math.ceil(material.duration_seconds / 60)} мин</span> : null}</div></div></div>
        {material.download_allowed && material.download_url ? <button className="student-pressable inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-2.5 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60" disabled={downloadMutation.isPending} onClick={() => downloadMutation.mutate()} type="button"><Download aria-hidden="true" size={17} />{downloadMutation.isPending ? "Скачиваем…" : "Скачать"}</button> : null}
      </header>

      {downloadMutation.isError ? <div className="rounded-brand border-2 border-danger bg-danger/10 p-4 text-sm font-bold text-danger" role="alert">{downloadMutation.error.message}</div> : null}

      {material.type === "video" ? playbackUrl ? <section className="grid min-h-80 place-items-center overflow-hidden rounded-brand border-2 border-line bg-navy p-3 sm:p-6"><video className="max-h-[70vh] w-full max-w-4xl rounded-brand" controls crossOrigin="use-credentials" preload="metadata" src={playbackUrl}>Ваш браузер не поддерживает видеоплеер.</video></section> : <StatePanel description={material.video_status === "failed" ? "Обработка видео завершилась ошибкой." : "Backend ещё не подготовил видео к воспроизведению."} title="Видео пока недоступно" /> : null}

      {isExternal ? material.external_url ? <section className="grid min-h-80 place-items-center rounded-brand border-2 border-line bg-mist p-8 text-center"><div className="grid max-w-lg justify-items-center gap-4"><span className="grid size-20 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-macaw-dark"><Icon aria-hidden="true" size={38} /></span><h2 className="text-2xl font-black text-navy">Переход на внешний ресурс</h2><p className="text-sm leading-6 text-ash">Ресурс откроется в новой вкладке. Проверьте адрес сайта перед вводом персональных данных.</p><a className="student-pressable inline-flex items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 py-3 text-sm font-black text-white" href={material.external_url} rel="noreferrer" target="_blank">Открыть ресурс<ExternalLink aria-hidden="true" size={17} /></a></div></section> : <StatePanel description="Backend не вернул URL внешнего ресурса." title="Ссылка недоступна" /> : null}

      {!isExternal && material.type !== "video" ? <section className="grid min-h-[360px] place-items-center rounded-brand border-2 border-dashed border-line bg-mist p-8 text-center"><div className="grid max-w-lg justify-items-center gap-4"><span className="grid size-20 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-macaw-dark"><Icon aria-hidden="true" size={38} /></span><h2 className="text-2xl font-black text-navy">{material.original_filename || material.title}</h2><p className="text-sm leading-6 text-ash">Файл защищён авторизацией. Используйте кнопку скачивания, если преподаватель разрешил загрузку.</p>{!material.download_allowed ? <span className="rounded-brand border-2 border-line bg-paper px-4 py-2 text-sm font-black text-ash">Скачивание запрещено преподавателем</span> : null}</div></section> : null}
    </div>
  );
}

function MaterialError({ description }: { description: string }) {
  return <StatePanel action={<Link className="student-pressable mt-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-2.5 text-sm font-black text-white" to="/student/courses">Вернуться к курсам</Link>} description={description} kind="error" title="Материал недоступен" />;
}
