import { Eye, FileText, Filter, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MaterialPreviewDialog from "../../components/staff/MaterialPreviewDialog";
import { getCourseStructure } from "../../services/courseStructureService";
import { getVisibleCourses, subscribeCourseStore } from "../../services/courseService";
import { getAllMaterials } from "../../services/materialService";
import { getStaffSession } from "../../services/staffSession";
import type { StaffMaterial, StaffMaterialType } from "../../types/staff";
import { cn } from "../../utils/cn";
import { formatFileSize, staffMaterialTypeLabels } from "../../utils/materialDisplay";

export default function StaffMaterialsPage() {
  const session = getStaffSession();
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<StaffMaterialType | "all">("all");
  const [selectedCourseId, setSelectedCourseId] = useState("all");
  const [preview, setPreview] = useState<StaffMaterial | null>(null);

  useEffect(() => subscribeCourseStore(() => setRevision((value) => value + 1)), []);
  const sessionRole = session?.role;
  const sessionUserId = session?.userId;
  const courses = useMemo(() => revision >= 0 && sessionRole && sessionUserId ? getVisibleCourses(sessionRole, sessionUserId) : [], [revision, sessionRole, sessionUserId]);
  const courseIds = new Set(courses.map((course) => course.id));

  const context = useMemo(() => {
    const lessonMap = new Map<string, { courseId: string; courseTitle: string; lessonTitle: string }>();
    courses.forEach((course) => {
      getCourseStructure(course.id).lessons.forEach((lesson) => lessonMap.set(lesson.id, { courseId: course.id, courseTitle: course.title, lessonTitle: lesson.title }));
    });
    return lessonMap;
  }, [courses]);
  const materials = useMemo(() => getAllMaterials().filter((material) => context.has(material.lessonId)), [context]);

  if (!session) return null;

  const normalizedQuery = query.trim().toLocaleLowerCase("ru");
  const filtered = materials.filter((material) => {
    const itemContext = context.get(material.lessonId);
    const matchesCourse = selectedCourseId === "all" || itemContext?.courseId === selectedCourseId;
    const matchesType = type === "all" || material.type === type;
    const matchesQuery = !normalizedQuery || `${material.title} ${material.description} ${material.fileName ?? ""} ${itemContext?.lessonTitle ?? ""}`.toLocaleLowerCase("ru").includes(normalizedQuery);
    return matchesCourse && matchesType && matchesQuery;
  });

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Learning Materials</span><h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">Материалы</h1><p className="mt-2 text-sm text-ash">Все учебные файлы и ресурсы доступных вам курсов.</p></div><div className="rounded-brand border-2 border-line bg-paper px-4 py-3 text-center"><strong className="block text-2xl font-black text-navy">{materials.length}</strong><span className="text-[10px] font-black uppercase tracking-wider text-ash">Всего материалов</span></div></header>

      <section className="grid gap-3 rounded-brand border-2 border-line bg-paper p-4 md:grid-cols-[minmax(0,1fr)_220px_240px_auto]">
        <label className="relative"><Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" size={17} /><span className="sr-only">Поиск материалов</span><input className="min-h-12 w-full rounded-brand border-2 border-line pl-10 pr-3 text-sm font-bold text-graphite outline-none focus:border-macaw" onChange={(event) => setQuery(event.target.value)} placeholder="Название, файл или урок" value={query} /></label>
        <label><span className="sr-only">Тип материала</span><select className="min-h-12 w-full rounded-brand border-2 border-line px-3 text-sm font-bold text-graphite outline-none focus:border-macaw" onChange={(event) => setType(event.target.value as StaffMaterialType | "all")} value={type}><option value="all">Все типы</option>{(Object.entries(staffMaterialTypeLabels) as Array<[StaffMaterialType, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span className="sr-only">Курс</span><select className="min-h-12 w-full rounded-brand border-2 border-line px-3 text-sm font-bold text-graphite outline-none focus:border-macaw" onChange={(event) => setSelectedCourseId(event.target.value)} value={selectedCourseId}><option value="all">Все курсы</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.title}</option>)}</select></label>
        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-line px-4 text-sm font-black text-graphite hover:bg-mist" onClick={() => { setQuery(""); setType("all"); setSelectedCourseId("all"); }} type="button"><Filter aria-hidden="true" size={17} /> Сбросить</button>
      </section>

      <div className="grid gap-3">
        {filtered.length ? filtered.map((material) => {
          const itemContext = context.get(material.lessonId);
          if (!itemContext || !courseIds.has(itemContext.courseId)) return null;
          return <article className="grid gap-4 rounded-brand border-2 border-line bg-paper p-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center" key={material.id}><span className="grid size-12 place-items-center rounded-brand bg-mist text-macaw-dark"><FileText aria-hidden="true" size={22} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-base font-black text-navy">{material.title}</h2><span className="rounded-brand border-2 border-line px-2 py-0.5 text-[10px] font-black text-ash">{staffMaterialTypeLabels[material.type]}</span><span className={cn("rounded-brand px-2 py-1 text-[10px] font-black", material.availability === "available" ? "bg-ecto/15 text-ecto-dark" : material.availability === "error" ? "bg-danger/10 text-danger" : "bg-warning/15 text-warning-dark")}>{material.availability === "available" ? "Доступен" : material.availability === "error" ? "Ошибка" : "Недоступен"}</span></div><p className="mt-1 truncate text-xs font-bold text-graphite">{itemContext.courseTitle} · {itemContext.lessonTitle}</p><p className="mt-1 truncate text-xs text-ash">{material.fileName ?? material.url ?? "Mock-источник"} · {formatFileSize(material.sizeBytes)}</p></div><div className="flex flex-wrap gap-2 lg:justify-end"><button className="inline-flex min-h-10 items-center gap-2 rounded-brand border-2 border-line px-3 text-xs font-black text-graphite hover:bg-mist" onClick={() => setPreview(material)} type="button"><Eye aria-hidden="true" size={15} /> Просмотр</button><Link className="inline-flex min-h-10 items-center gap-2 rounded-brand border-2 border-ecto px-3 text-xs font-black text-ecto-dark hover:bg-ecto/10" to={`/courses/${itemContext.courseId}/lessons/${material.lessonId}/edit`}>Открыть урок</Link></div></article>;
        }) : <div className="rounded-brand border-2 border-dashed border-line bg-paper p-10 text-center"><FileText aria-hidden="true" className="mx-auto text-ash" size={36} /><h2 className="mt-3 text-xl font-black text-navy">Материалы не найдены</h2><p className="mt-2 text-sm text-ash">Измените фильтры или добавьте материал через редактор урока.</p></div>}
      </div>
      <MaterialPreviewDialog material={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
