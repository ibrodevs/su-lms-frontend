import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, FileText, Filter, Play, Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { courseKeys } from "../../api/courseKeys";
import { coursesApi } from "../../api/courses.api";
import { learningApi, resolveApiResourceUrl } from "../../api/learning.api";
import type { CourseMaterialListParams, LearningMaterialDto, LearningMaterialType } from "../../api/learning.api";
import { learningKeys } from "../../api/learningKeys";
import StatePanel from "../../components/student/StatePanel";
import { formatLearningFileSize, learningMaterialTypeLabels, saveBlob } from "../../utils/learningDisplay";

export default function StaffMaterialsPage() {
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<LearningMaterialType | "">("");
  const [downloadError, setDownloadError] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const deferredSearch = useDeferredValue(search.trim());
  const coursesParams = useMemo(() => ({ pageSize: 100, ordering: "title" }), []);
  const coursesQuery = useQuery({ queryKey: courseKeys.list(coursesParams), queryFn: () => coursesApi.list(coursesParams) });
  const effectiveCourseId = selectedCourseId ? Number(selectedCourseId) : coursesQuery.data?.results[0]?.id ?? 0;
  const materialParams = useMemo<CourseMaterialListParams>(() => ({ search: deferredSearch || undefined, type: type || undefined }), [deferredSearch, type]);
  const materialsQuery = useQuery({ queryKey: learningKeys.courseMaterials(effectiveCourseId, materialParams), queryFn: () => learningApi.courseMaterials(effectiveCourseId, materialParams), enabled: effectiveCourseId > 0 });
  const structureQuery = useQuery({ queryKey: learningKeys.structure(effectiveCourseId), queryFn: () => learningApi.structure(effectiveCourseId), enabled: effectiveCourseId > 0 });
  const lessonContext = useMemo(() => {
    const context = new Map<number, { moduleTitle: string; topicTitle: string; lessonTitle: string }>();
    structureQuery.data?.modules.forEach((module) => module.topics.forEach((topic) => topic.lessons.forEach((lesson) => context.set(lesson.id, { moduleTitle: module.title, topicTitle: topic.title, lessonTitle: lesson.title }))));
    return context;
  }, [structureQuery.data]);

  const resetFilters = () => { setSearch(""); setType(""); };
  const download = async (material: LearningMaterialDto) => {
    setDownloadError("");
    setDownloadingId(material.id);
    try {
      const blob = await learningApi.downloadMaterial(material.id);
      saveBlob(blob, material.original_filename || material.title);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Не удалось скачать материал.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (coursesQuery.isPending) return <StatePanel description="Получаем доступные курсы." kind="loading" title="Загрузка материалов" />;
  if (coursesQuery.isError) return <StatePanel description={coursesQuery.error.message} kind="error" title="Не удалось загрузить курсы" />;
  if (!coursesQuery.data.results.length) return <StatePanel description="У вашей роли нет доступных курсов." title="Материалы недоступны" />;

  const selectedCourse = coursesQuery.data.results.find((course) => course.id === effectiveCourseId);
  const queryError = materialsQuery.error ?? structureQuery.error;
  const materials = materialsQuery.data ?? [];
  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Learning Materials</span><h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">Материалы</h1><p className="mt-2 text-sm text-ash">Backend-каталог выбранного курса с серверными фильтрами.</p></div><div className="rounded-brand border-2 border-line bg-paper px-4 py-3 text-center"><strong className="block text-2xl font-black text-navy">{materials.length}</strong><span className="text-[10px] font-black uppercase tracking-wider text-ash">Найдено</span></div></header>

      <section className="grid gap-3 rounded-brand border-2 border-line bg-paper p-4 md:grid-cols-[260px_minmax(0,1fr)_220px_auto]">
        <label><span className="sr-only">Курс</span><select className={selectClasses} onChange={(event) => setSelectedCourseId(event.target.value)} value={String(effectiveCourseId)}>{coursesQuery.data.results.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.title}</option>)}</select></label>
        <label className="relative"><Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" size={17} /><span className="sr-only">Поиск материалов</span><input className="min-h-12 w-full rounded-brand border-2 border-line pl-10 pr-3 text-sm font-bold text-graphite outline-none focus:border-macaw" onChange={(event) => setSearch(event.target.value)} placeholder="Название, описание или файл" value={search} /></label>
        <label><span className="sr-only">Тип материала</span><select className={selectClasses} onChange={(event) => setType(event.target.value as LearningMaterialType | "")} value={type}><option value="">Все типы</option>{(Object.entries(learningMaterialTypeLabels) as Array<[LearningMaterialType, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-line px-4 text-sm font-black text-graphite hover:bg-mist" onClick={resetFilters} type="button"><Filter aria-hidden="true" size={17} /> Сбросить</button>
      </section>

      {downloadError ? <p className="rounded-brand border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{downloadError}</p> : null}
      {materialsQuery.isPending || structureQuery.isPending ? <StatePanel description={`Получаем материалы курса ${selectedCourse?.code ?? ""}.`} kind="loading" title="Загрузка каталога" /> : queryError ? <StatePanel description={queryError.message} kind="error" title="Не удалось загрузить материалы" /> : materials.length ? <div className="grid gap-3">{materials.map((material) => {
        const context = lessonContext.get(material.lesson);
        return <article className="grid gap-4 rounded-brand border-2 border-line bg-paper p-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center" key={material.id}><span className="grid size-12 place-items-center rounded-brand bg-mist text-macaw-dark"><FileText aria-hidden="true" size={22} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-base font-black text-navy">{material.title}</h2><span className="rounded-brand border-2 border-line px-2 py-0.5 text-[10px] font-black text-ash">{learningMaterialTypeLabels[material.type]}</span>{material.video_status ? <span className="rounded-brand bg-warning/15 px-2 py-1 text-[10px] font-black text-warning-dark">{material.video_status}</span> : null}</div><p className="mt-1 truncate text-xs font-bold text-graphite">{context ? `${context.moduleTitle} · ${context.topicTitle} · ${context.lessonTitle}` : `Lesson #${material.lesson}`}</p><p className="mt-1 truncate text-xs text-ash">{material.original_filename || material.external_url || "Backend resource"} · {formatLearningFileSize(material.size)}</p></div><div className="flex flex-wrap gap-2 lg:justify-end">{material.external_url ? <a className={actionClasses} href={material.external_url} rel="noreferrer" target="_blank"><ExternalLink aria-hidden="true" size={15} /> Открыть</a> : null}{material.playback_url ? <a className={actionClasses} href={resolveApiResourceUrl(material.playback_url)} rel="noreferrer" target="_blank"><Play aria-hidden="true" size={15} /> Смотреть</a> : null}{material.download_url && material.download_allowed ? <button className={actionClasses} disabled={downloadingId === material.id} onClick={() => download(material)} type="button"><Download aria-hidden="true" size={15} /> {downloadingId === material.id ? "Загрузка…" : "Скачать"}</button> : null}<Link className="inline-flex min-h-10 items-center rounded-brand border-2 border-ecto px-3 text-xs font-black text-ecto-dark hover:bg-ecto/10" to={`/courses/${effectiveCourseId}/lessons/${material.lesson}/edit`}>Открыть урок</Link></div></article>;
      })}</div> : <StatePanel description="Измените фильтры или добавьте материал через редактор урока." title="Материалы не найдены" />}
    </div>
  );
}

const selectClasses = "min-h-12 w-full rounded-brand border-2 border-line bg-paper px-3 text-sm font-bold text-graphite outline-none focus:border-macaw";
const actionClasses = "inline-flex min-h-10 items-center gap-2 rounded-brand border-2 border-line px-3 text-xs font-black text-graphite hover:border-macaw disabled:opacity-50";
