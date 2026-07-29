import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileAudio,
  FileImage,
  FileText,
  Library,
  Presentation,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import StatePanel from "../../components/student/StatePanel";
import {
  getCourseForMaterial,
  getLessonForMaterial,
  getMaterialById,
} from "../../services/studentCatalog";
import type { Material } from "../../types/student";

interface MaterialRouteParams {
  materialId: string;
}

const icons = {
  pdf: FileText,
  docx: FileText,
  pptx: Presentation,
  audio: FileAudio,
  image: FileImage,
  external: ExternalLink,
  library: Library,
} satisfies Record<Material["type"], typeof FileText>;

const typeLabels: Record<Material["type"], string> = {
  pdf: "PDF-документ",
  docx: "Документ DOCX",
  pptx: "Презентация PPTX",
  audio: "Аудиоматериал",
  image: "Изображение",
  external: "Внешний ресурс",
  library: "Электронная библиотека",
};

function getDomain(url?: string): string {
  if (!url) return "Внешний сайт";
  try {
    return new URL(url, window.location.origin).hostname;
  } catch {
    return "Внешний сайт";
  }
}

export default function StudentMaterialPage() {
  const { materialId } = useParams<MaterialRouteParams>();
  const material = getMaterialById(materialId);

  if (!material) {
    return (
      <StatePanel
        action={
          <Link
            className="student-pressable mt-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-2.5 text-sm font-black text-white"
            to="/student/courses"
          >
            Вернуться к курсам
          </Link>
        }
        description="Материал не существует или ссылка устарела."
        kind="error"
        title="Материал не найден"
      />
    );
  }

  const course = getCourseForMaterial(material);
  const lesson = getLessonForMaterial(material);
  const backUrl =
    course && lesson
      ? `/student/courses/${course.id}/lessons/${lesson.id}`
      : course
        ? `/student/courses/${course.id}`
        : "/student/courses";
  const Icon = icons[material.type];

  const unavailableContent = {
    unavailable: {
      title: "Материал пока недоступен",
      description:
        "Завершите предыдущие уроки или дождитесь даты открытия материала.",
    },
    deleted: {
      title: "Файл удалён",
      description:
        "Автор курса удалил этот файл. Обратитесь к преподавателю за актуальной версией.",
    },
    error: {
      title: "Ошибка загрузки",
      description:
        "Preview не удалось загрузить. Попробуйте открыть материал позже.",
    },
  } as const;

  if (material.availability !== "available") {
    const stateContent = unavailableContent[material.availability];
    return (
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
        <Link
          className="inline-flex items-center gap-2 text-xs font-black text-macaw-dark hover:underline"
          to={backUrl}
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Вернуться к уроку
        </Link>
        <StatePanel
          action={
            <Link
              className="student-pressable mt-2 rounded-brand border-2 border-lingot bg-paper px-4 py-2.5 text-sm font-black text-ecto-dark"
              to={backUrl}
            >
              Назад
            </Link>
          }
          description={stateContent.description}
          kind={material.availability === "error" ? "error" : "empty"}
          title={stateContent.title}
        />
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <Link
        className="inline-flex w-fit items-center gap-2 text-xs font-black text-macaw-dark hover:underline"
        to={backUrl}
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Вернуться к уроку
      </Link>

      <header className="flex flex-col justify-between gap-5 rounded-brand border-2 border-line p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-macaw-dark">
            <Icon aria-hidden="true" size={27} />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-macaw-dark">
              {typeLabels[material.type]}
            </span>
            <h1 className="mt-1 text-2xl font-black text-navy sm:text-3xl">
              {material.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-ash">
              {material.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-ash">
              {material.size && <span>{material.size}</span>}
              {material.pageCount && <span>{material.pageCount} страниц</span>}
              {material.duration && <span>{material.duration}</span>}
            </div>
          </div>
        </div>
        {material.downloadAllowed && material.url && (
          <a
            className="student-pressable inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-2.5 text-sm font-black text-white"
            download
            href={material.url}
          >
            <Download aria-hidden="true" size={17} />
            Скачать
          </a>
        )}
      </header>

      {material.type === "pdf" && material.url && (
        <section className="overflow-hidden rounded-brand border-2 border-line bg-mist">
          <iframe
            className="h-[70vh] min-h-[520px] w-full"
            src={material.url}
            title={material.title}
          />
        </section>
      )}

      {material.type === "image" && material.url && (
        <section className="grid min-h-96 place-items-center rounded-brand border-2 border-line bg-mist p-6">
          <img
            alt={material.title}
            className="max-h-[70vh] max-w-full object-contain"
            src={material.url}
          />
        </section>
      )}

      {material.type === "audio" && material.url && (
        <section className="grid min-h-64 place-items-center rounded-brand border-2 border-line bg-mist p-6">
          <div className="grid w-full max-w-2xl justify-items-center gap-5">
            <span className="grid size-20 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-macaw-dark">
              <FileAudio aria-hidden="true" size={38} />
            </span>
            <audio className="w-full" controls preload="metadata">
              <source src={material.url} type="audio/mpeg" />
              Ваш браузер не поддерживает аудиоплеер.
            </audio>
          </div>
        </section>
      )}

      {(material.type === "docx" || material.type === "pptx") && (
        <section className="grid min-h-[420px] place-items-center rounded-brand border-2 border-dashed border-line bg-mist p-8 text-center">
          <div className="grid max-w-lg justify-items-center gap-4">
            <span className="grid size-20 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-macaw-dark">
              <Icon aria-hidden="true" size={38} />
            </span>
            <h2 className="text-2xl font-black text-navy">
              Preview {material.type.toUpperCase()}
            </h2>
            <p className="text-sm leading-6 text-ash">
              В статичной версии показывается информация о файле. Полноценный
              просмотр будет подключён вместе с backend file service.
            </p>
            {material.url ? (
              <a
                className="student-pressable rounded-brand border-2 border-lingot bg-paper px-5 py-3 text-sm font-black text-ecto-dark"
                href={material.url}
                rel="noreferrer"
                target="_blank"
              >
                Открыть файл
              </a>
            ) : (
              <span className="rounded-brand border-2 border-line bg-paper px-5 py-3 text-sm font-black text-ash">
                Preview-placeholder
              </span>
            )}
          </div>
        </section>
      )}

      {(material.type === "external" || material.type === "library") &&
        material.url && (
          <section className="grid min-h-80 place-items-center rounded-brand border-2 border-line bg-mist p-8 text-center">
            <div className="grid max-w-lg justify-items-center gap-4">
              <span className="grid size-20 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-macaw-dark">
                <Icon aria-hidden="true" size={38} />
              </span>
              <span className="rounded-brand border-2 border-line bg-paper px-3 py-1 text-xs font-black text-ash">
                {getDomain(material.url)}
              </span>
              <h2 className="text-2xl font-black text-navy">
                Переход на внешний ресурс
              </h2>
              <p className="text-sm leading-6 text-ash">
                Ресурс откроется в новой вкладке. Перед вводом персональных
                данных проверьте адрес сайта.
              </p>
              <a
                className="student-pressable inline-flex items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 py-3 text-sm font-black text-white"
                href={material.url}
                rel="noreferrer"
                target="_blank"
              >
                Открыть ресурс
                <ExternalLink aria-hidden="true" size={17} />
              </a>
            </div>
          </section>
        )}
    </div>
  );
}
