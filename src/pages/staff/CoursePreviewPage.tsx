import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, ChevronDown, Clock3, Download, ExternalLink, Eye, FileArchive, FileText, GraduationCap, LockKeyhole, Play, UserRound } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import { courseKeys } from "../../api/courseKeys";
import { coursesApi } from "../../api/courses.api";
import type { CourseLanguage } from "../../api/courses.api";
import { learningApi, resolveApiResourceUrl } from "../../api/learning.api";
import type { CourseStructureDto, LearningMaterialDto, ScormPackageDto, StructureLessonDto, StructureModuleDto } from "../../api/learning.api";
import { learningKeys } from "../../api/learningKeys";
import ApiCourseStatusBadge from "../../components/staff/ApiCourseStatusBadge";
import StatePanel from "../../components/student/StatePanel";
import { formatLearningFileSize, learningMaterialTypeLabels, saveBlob } from "../../utils/learningDisplay";

interface RouteParams { courseId: string; }

const languageLabels: Record<CourseLanguage, string> = { ru: "Русский", ky: "Кыргызский", en: "English" };
const releaseLabels: Record<StructureLessonDto["release_type"], string> = { always: "Доступен сразу", after_previous: "После предыдущего урока", after_lesson: "После обязательного урока", date: "По дате" };

export default function CoursePreviewPage() {
  const { courseId } = useParams<RouteParams>();
  const numericCourseId = Number(courseId);
  const enabled = Number.isInteger(numericCourseId) && numericCourseId > 0;
  const [requestedLessonId, setRequestedLessonId] = useState<number | null>(null);
  const [downloadState, setDownloadState] = useState<{ error: string; materialId: number | null }>({ error: "", materialId: null });
  const courseQuery = useQuery({ queryKey: courseKeys.detail(numericCourseId), queryFn: () => coursesApi.detail(numericCourseId), enabled });
  const structureQuery = useQuery({ queryKey: learningKeys.structure(numericCourseId), queryFn: () => learningApi.structure(numericCourseId), enabled });
  const materialsQuery = useQuery({ queryKey: learningKeys.courseMaterials(numericCourseId, {}), queryFn: () => learningApi.courseMaterials(numericCourseId), enabled });
  const flatLessons = flattenLessons(structureQuery.data);
  const selectedLesson = flatLessons.find((lesson) => lesson.id === requestedLessonId) ?? flatLessons[0] ?? null;
  const selectedLessonId = selectedLesson?.id ?? 0;
  const lessonQuery = useQuery({ queryKey: learningKeys.lesson(selectedLessonId), queryFn: () => learningApi.lesson(selectedLessonId), enabled: selectedLessonId > 0 });
  const scormQuery = useQuery({ queryKey: learningKeys.scorm(selectedLessonId), queryFn: () => learningApi.scormPackages(selectedLessonId), enabled: selectedLessonId > 0 });

  if (!enabled) return <PreviewState description="Идентификатор курса должен быть положительным числом." title="Некорректная ссылка" />;
  if (courseQuery.isPending || structureQuery.isPending || materialsQuery.isPending) return <PreviewState description="Получаем курс, структуру и материалы с backend." loading title="Загрузка предпросмотра" />;
  if (courseQuery.isError || structureQuery.isError || materialsQuery.isError) return <PreviewState description={(courseQuery.error ?? structureQuery.error ?? materialsQuery.error)?.message ?? "Не удалось получить курс."} title="Предпросмотр недоступен" />;

  const course = courseQuery.data;
  const structure = structureQuery.data;
  const materials = materialsQuery.data;
  const selectedMaterials = selectedLesson ? materials.filter((material) => material.lesson === selectedLesson.id) : [];
  const totalDuration = flatLessons.reduce((total, lesson) => total + (lesson.estimated_duration_minutes ?? 0), 0);
  const download = async (material: LearningMaterialDto) => {
    setDownloadState({ error: "", materialId: material.id });
    try {
      const blob = await learningApi.downloadMaterial(material.id);
      saveBlob(blob, material.original_filename || material.title);
      setDownloadState({ error: "", materialId: null });
    } catch (error) {
      setDownloadState({ error: error instanceof Error ? error.message : "Не удалось скачать материал.", materialId: null });
    }
  };

  return (
    <div className="student-theme min-h-screen bg-mist text-graphite">
      <header className="sticky top-0 z-40 border-b-2 border-line bg-paper/95 backdrop-blur"><div className="mx-auto flex min-h-18 max-w-[1280px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8"><Link aria-label="SU LMS — вернуться к редактированию" className="flex min-w-0 items-center gap-3" to={`/courses/${course.id}/builder`}><span className="grid size-11 shrink-0 place-items-center rounded-brand border-2 border-ecto-dark bg-ecto text-white"><BookOpen aria-hidden="true" size={21} /></span><span className="min-w-0"><strong className="block truncate text-sm font-black text-navy">SU LMS</strong><span className="block truncate text-[10px] font-black uppercase tracking-[0.13em] text-ecto-dark">Student Preview</span></span></Link><div className="flex items-center gap-2"><span className="hidden items-center gap-2 rounded-brand border-2 border-macaw/30 bg-macaw/10 px-3 py-2 text-xs font-black text-macaw-dark sm:inline-flex"><Eye aria-hidden="true" size={15} /> Реальные данные backend</span><Link className="student-pressable inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-3 text-xs font-black text-white sm:px-4 sm:text-sm" to={`/courses/${course.id}/builder`}><ArrowLeft aria-hidden="true" size={16} /><span className="hidden sm:inline">Вернуться к редактированию</span><span className="sm:hidden">Назад</span></Link></div></div></header>

      <main className="mx-auto grid max-w-[1280px] gap-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="overflow-hidden rounded-brand border-2 border-line bg-paper"><div className="grid lg:grid-cols-[360px_minmax(0,1fr)]"><div className="relative grid min-h-64 place-items-center overflow-hidden border-b-2 border-line bg-gradient-to-br from-navy via-macaw-dark to-ecto-dark p-7 text-white lg:border-b-0 lg:border-r-2">{course.cover ? <img alt={`Обложка курса ${course.title}`} className="absolute inset-0 size-full object-cover" src={course.cover} /> : <div className="relative z-10 grid justify-items-center gap-4 text-center"><span className="grid size-20 place-items-center rounded-brand border-2 border-white/50 bg-white/15"><BookOpen aria-hidden="true" size={40} /></span><span className="text-sm font-black uppercase tracking-[0.2em]">{course.code}</span></div>}<div aria-hidden="true" className="absolute -bottom-20 -right-16 size-56 rounded-full border-[32px] border-white/10" /></div><div className="grid content-center gap-5 p-5 sm:p-7 lg:p-9"><div className="flex flex-wrap items-center gap-2"><ApiCourseStatusBadge status={course.status} /><span className="rounded-brand border-2 border-navy bg-navy/10 px-2.5 py-1 text-xs font-black text-navy">{course.code}</span></div><div><h1 className="text-3xl font-black tracking-tight text-navy sm:text-4xl lg:text-5xl">{course.title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-ash sm:text-base">{course.description || "Описание курса не заполнено."}</p></div><p className="text-xs font-bold text-ash">Структура backend: {structure.modules.length} модулей · {flatLessons.length} уроков · {materials.length} материалов</p></div></div></section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><PreviewMeta icon={UserRound} label="Преподаватель" value={course.teacher?.full_name ?? "Не назначен"} /><PreviewMeta icon={GraduationCap} label="Кредиты" value={`${course.credits} кредитов`} /><PreviewMeta icon={Clock3} label="Продолжительность" value={`${totalDuration} минут`} /><PreviewMeta icon={FileText} label="Язык" value={languageLabels[course.language]} /></section>

        <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(330px,0.85fr)_minmax(0,1.35fr)] lg:items-start">
          <div className="grid gap-4"><header><span className="text-xs font-black uppercase tracking-[0.15em] text-ecto-dark">Учебный план</span><h2 className="mt-1 text-2xl font-black text-navy">Содержание курса</h2><p className="mt-1 text-sm text-ash">Публикация и условия доступа отображаются без симуляции прогресса.</p></header>{structure.modules.length ? structure.modules.map((module, index) => <PreviewModuleCard initiallyOpen={index === 0} key={module.id} module={module} onSelectLesson={setRequestedLessonId} selectedLessonId={selectedLesson?.id ?? null} />) : <div className="rounded-brand border-2 border-dashed border-line bg-paper p-6 text-center"><BookOpen aria-hidden="true" className="mx-auto text-ash" size={34} /><h3 className="mt-3 text-lg font-black text-navy">Структура пока не добавлена</h3><p className="mt-2 text-sm text-ash">Добавьте модули, темы и уроки в Course Builder.</p></div>}</div>
          <LessonPreview isLoading={selectedLessonId > 0 && lessonQuery.isPending} lessonError={lessonQuery.error?.message} lesson={lessonQuery.data} materials={selectedMaterials} downloadError={downloadState.error} downloadingId={downloadState.materialId} onDownload={download} scormError={scormQuery.error?.message} scormPackages={scormQuery.data ?? []} />
        </section>
      </main>
    </div>
  );
}

function flattenLessons(structure?: CourseStructureDto): StructureLessonDto[] { return structure?.modules.flatMap((module) => module.topics.flatMap((topic) => topic.lessons)) ?? []; }

function PreviewState({ description, loading = false, title }: { description: string; loading?: boolean; title: string }) { return <div className="student-theme grid min-h-screen place-items-center bg-mist p-5"><div className="w-full max-w-xl"><StatePanel action={<Link className="text-sm font-black text-macaw-dark hover:underline" to="/courses">Вернуться к курсам</Link>} description={description} kind={loading ? "loading" : "error"} title={title} /></div></div>; }

function PreviewMeta({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) { return <article className="flex min-w-0 items-center gap-3 rounded-brand border-2 border-line bg-paper p-4"><span className="grid size-11 shrink-0 place-items-center rounded-brand bg-macaw/10 text-macaw-dark"><Icon aria-hidden="true" size={20} /></span><div className="min-w-0"><span className="block text-[10px] font-black uppercase tracking-wider text-ash">{label}</span><strong className="mt-1 block truncate text-sm font-black text-graphite">{value}</strong></div></article>; }

function PreviewModuleCard({ initiallyOpen, module, onSelectLesson, selectedLessonId }: { initiallyOpen: boolean; module: StructureModuleDto; onSelectLesson: (lessonId: number) => void; selectedLessonId: number | null }) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const lessonCount = module.topics.reduce((total, topic) => total + topic.lessons.length, 0);
  return <article className="overflow-hidden rounded-brand border-2 border-line bg-paper"><button aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-mist" onClick={() => setIsOpen((value) => !value)} type="button"><span className="min-w-0"><span className="text-[10px] font-black uppercase tracking-wider text-ecto-dark">Модуль {module.order} · {lessonCount} уроков</span><strong className="mt-1 block text-base font-black text-navy">{module.title}</strong></span><ChevronDown aria-hidden="true" className={`shrink-0 text-ash transition-transform ${isOpen ? "rotate-180" : ""}`} size={19} /></button>{isOpen ? <div className="grid gap-4 border-t-2 border-line bg-mist/40 p-3 sm:p-4">{module.topics.map((topic) => <section key={topic.id}><h3 className="px-2 text-xs font-black uppercase tracking-wider text-ash">{topic.title}</h3><div className="mt-2 grid gap-2">{topic.lessons.map((lesson) => { const isSelected = selectedLessonId === lesson.id; return <button aria-current={isSelected ? "true" : undefined} className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-brand border-2 p-3 text-left ${isSelected ? "border-ecto bg-ecto/10" : "border-transparent bg-paper hover:border-lingot"}`} key={lesson.id} onClick={() => onSelectLesson(lesson.id)} type="button"><span className={`grid size-9 place-items-center rounded-brand ${lesson.is_published ? "bg-ecto/15 text-ecto-dark" : "bg-mist text-ash"}`}>{lesson.is_published ? <BookOpen aria-hidden="true" size={17} /> : <LockKeyhole aria-hidden="true" size={17} />}</span><span className="min-w-0"><strong className="block text-sm font-black text-graphite">{lesson.title}</strong><span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-ash"><span>{lesson.estimated_duration_minutes ?? 0} мин</span><span>{lesson.is_published ? "Опубликован" : "Скрыт"}</span><span>{releaseLabels[lesson.release_type]}</span></span></span></button>; })}</div></section>)}</div> : null}</article>;
}

interface LessonPreviewProps { downloadError: string; downloadingId: number | null; isLoading: boolean; lesson?: Awaited<ReturnType<typeof learningApi.lesson>>; lessonError?: string; materials: LearningMaterialDto[]; onDownload: (material: LearningMaterialDto) => Promise<void>; scormError?: string; scormPackages: ScormPackageDto[]; }

function LessonPreview({ downloadError, downloadingId, isLoading, lesson, lessonError, materials, onDownload, scormError, scormPackages }: LessonPreviewProps) {
  if (isLoading) return <section className="rounded-brand border-2 border-line bg-paper p-5 lg:sticky lg:top-24"><StatePanel description="Получаем содержимое выбранного урока." kind="loading" title="Загрузка урока" /></section>;
  if (lessonError) return <section className="rounded-brand border-2 border-line bg-paper p-5 lg:sticky lg:top-24"><StatePanel description={lessonError} kind="error" title="Урок недоступен" /></section>;
  if (!lesson) return <section className="grid min-h-96 place-items-center rounded-brand border-2 border-dashed border-line bg-paper p-7 text-center lg:sticky lg:top-24"><div><BookOpen aria-hidden="true" className="mx-auto text-ash" size={42} /><h2 className="mt-4 text-xl font-black text-navy">В курсе пока нет уроков</h2></div></section>;
  return <section className="min-w-0 overflow-hidden rounded-brand border-2 border-line bg-paper lg:sticky lg:top-24"><header className="border-b-2 border-line p-5 sm:p-6"><div className="flex flex-wrap items-center gap-2 text-xs font-black text-ecto-dark"><span>{lesson.is_published ? "Опубликованный урок" : "Скрытый урок"}</span><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1 text-ash"><Clock3 aria-hidden="true" size={14} /> {lesson.estimated_duration_minutes ?? 0} минут</span></div><h2 className="mt-2 text-2xl font-black tracking-tight text-navy sm:text-3xl">{lesson.title}</h2><p className="mt-2 text-sm leading-6 text-ash">{lesson.description || "Описание урока не заполнено."}</p></header><div className="grid gap-5 p-5 sm:p-6"><article className="student-rich-text prose prose-sm max-w-none text-charcoal"><ReactMarkdown>{lesson.content || "Контент урока пока не заполнен."}</ReactMarkdown></article><ResourceSection downloadError={downloadError} downloadingId={downloadingId} materials={materials} onDownload={onDownload} scormError={scormError} scormPackages={scormPackages} /></div></section>;
}

function ResourceSection({ downloadError, downloadingId, materials, onDownload, scormError, scormPackages }: Pick<LessonPreviewProps, "downloadError" | "downloadingId" | "materials" | "onDownload" | "scormError" | "scormPackages">) {
  return <section className="border-t-2 border-line pt-5"><div><span className="text-[10px] font-black uppercase tracking-wider text-ecto-dark">Ресурсы урока</span><h3 className="mt-1 text-lg font-black text-navy">Материалы и SCORM</h3></div>{downloadError || scormError ? <p className="mt-4 rounded-brand border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{downloadError || scormError}</p> : null}{materials.length ? <div className="mt-4 grid gap-3">{materials.map((material) => <article className="grid min-w-0 gap-3 rounded-brand border-2 border-line p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center" key={material.id}><span className="grid size-11 place-items-center rounded-brand bg-macaw/10 text-macaw-dark"><FileText aria-hidden="true" size={20} /></span><div className="min-w-0"><strong className="block truncate text-sm font-black text-graphite">{material.title}</strong><span className="mt-1 block truncate text-xs font-bold text-ash">{learningMaterialTypeLabels[material.type]} · {formatLearningFileSize(material.size)}</span></div><div className="flex flex-wrap gap-2 sm:justify-end">{material.external_url ? <a className="inline-flex min-h-10 items-center gap-2 rounded-brand border-2 border-line px-3 text-xs font-black text-graphite" href={material.external_url} rel="noreferrer" target="_blank"><ExternalLink aria-hidden="true" size={15} /> Открыть</a> : null}{material.playback_url ? <a className="inline-flex min-h-10 items-center gap-2 rounded-brand border-2 border-macaw px-3 text-xs font-black text-macaw-dark" href={resolveApiResourceUrl(material.playback_url)} rel="noreferrer" target="_blank"><Play aria-hidden="true" size={15} /> Смотреть</a> : null}{material.download_url && material.download_allowed ? <button className="inline-flex min-h-10 items-center gap-2 rounded-brand border-2 border-line px-3 text-xs font-black text-graphite disabled:opacity-50" disabled={downloadingId === material.id} onClick={() => onDownload(material)} type="button"><Download aria-hidden="true" size={15} />{downloadingId === material.id ? "Загрузка…" : "Скачать"}</button> : null}</div></article>)}</div> : <div className="mt-4 flex items-center gap-3 rounded-brand border-2 border-dashed border-line p-4 text-sm font-bold text-ash"><FileText aria-hidden="true" size={20} /> Материалы не прикреплены.</div>}{scormPackages.length ? <div className="mt-4 grid gap-3">{scormPackages.map((item) => <article className="flex flex-wrap items-center justify-between gap-3 rounded-brand border-2 border-line p-4" key={item.id}><div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-brand bg-eel/20 text-ecto-dark"><FileArchive aria-hidden="true" size={20} /></span><div className="min-w-0"><strong className="block truncate text-sm font-black text-graphite">{item.title}</strong><span className="text-xs font-bold text-ash">SCORM {item.version} · {item.status}</span></div></div>{item.launch_url ? <a className="student-pressable inline-flex min-h-10 items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-xs font-black text-white" href={resolveApiResourceUrl(item.launch_url)} rel="noreferrer" target="_blank"><Play aria-hidden="true" size={15} /> Open SCORM</a> : null}</article>)}</div> : null}</section>;
}
