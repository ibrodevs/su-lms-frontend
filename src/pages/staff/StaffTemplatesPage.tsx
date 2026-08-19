import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, BookCopy, FileText, Plus, Search, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { courseKeys } from "../../api/courseKeys";
import { coursesApi } from "../../api/courses.api";
import type { CourseListDto, CourseListParams } from "../../api/courses.api";
import { queryClient } from "../../api/queryClient";
import { templateKeys } from "../../api/templateKeys";
import { templatesApi } from "../../api/templates.api";
import type { CourseTemplateDto, CreateCourseTemplatePayload } from "../../api/templates.api";
import { useAuth } from "../../auth/useAuth";
import CourseCopyDialog from "../../components/staff/CourseCopyDialog";
import StatePanel from "../../components/student/StatePanel";

const courseListParams: CourseListParams = { pageSize: 100, ordering: "title" };
const emptyTemplates: CourseTemplateDto[] = [];
const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
const inputClasses = "min-h-12 w-full rounded-brand border-2 border-line bg-paper px-3 text-sm font-bold text-graphite outline-none focus:border-macaw";

export default function StaffTemplatesPage() {
  const history = useHistory();
  const { can } = useAuth();
  const [query, setQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CourseTemplateDto | null>(null);
  const templatesQuery = useQuery({ queryKey: templateKeys.list(), queryFn: templatesApi.list, enabled: can("courses.copy") });
  const coursesQuery = useQuery({ queryKey: courseKeys.list(courseListParams), queryFn: () => coursesApi.list(courseListParams), enabled: can("courses.copy") });
  const templates = templatesQuery.data ?? emptyTemplates;
  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
    if (!normalizedQuery) return templates;
    return templates.filter((template) => `${template.title} ${template.description}`.toLocaleLowerCase("ru-RU").includes(normalizedQuery));
  }, [query, templates]);
  const createTemplateMutation = useMutation({ mutationFn: templatesApi.create, onSuccess: async () => { setIsCreateOpen(false); await queryClient.invalidateQueries({ queryKey: templateKeys.lists() }); } });
  const createCourseMutation = useMutation({
    mutationFn: ({ templateId, title, code }: { templateId: number; title: string; code: string }) => templatesApi.createCourse(templateId, { title, code }),
    onSuccess: async (course) => { await queryClient.invalidateQueries({ queryKey: courseKeys.lists() }); history.push(`/courses/${course.id}`); },
  });

  if (!can("courses.copy")) return <StatePanel action={<Link className="text-sm font-black text-macaw-dark hover:underline" to="/courses">Вернуться к курсам</Link>} description="Backend не выдал permission courses.copy для текущего пользователя." kind="error" title="Шаблоны недоступны" />;
  if (templatesQuery.isPending || coursesQuery.isPending) return <StatePanel description="Получаем шаблоны и доступные курсы с backend." kind="loading" title="Загрузка шаблонов" />;
  if (templatesQuery.isError || coursesQuery.isError) return <StatePanel description={(templatesQuery.error ?? coursesQuery.error)?.message ?? "Не удалось загрузить данные."} kind="error" title="Шаблоны недоступны" />;

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Course Templates</span><h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">Шаблоны курсов</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-ash">Создавайте независимые шаблоны из реальных курсов и разворачивайте из них новые Draft-курсы.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row"><Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-line px-5 text-sm font-black text-graphite hover:border-lingot hover:bg-eel/10" to="/courses/create"><FileText aria-hidden="true" size={18} /> Пустой курс</Link><button className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white disabled:opacity-50" disabled={!coursesQuery.data.results.length} onClick={() => setIsCreateOpen(true)} type="button"><Plus aria-hidden="true" size={18} /> Создать шаблон</button></div>
      </header>
      <label className="relative block max-w-2xl"><span className="sr-only">Поиск шаблонов</span><Search aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-ash" size={19} /><input className="h-12 w-full rounded-brand border-2 border-line bg-paper pl-11 pr-4 text-sm font-bold text-graphite outline-none focus:border-macaw" onChange={(event) => setQuery(event.target.value)} placeholder="Название или описание шаблона" value={query} /></label>

      {filteredTemplates.length ? <section aria-label="Список шаблонов" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredTemplates.map((template) => (
        <article className="flex min-h-72 flex-col rounded-brand border-2 border-line bg-paper p-5" key={template.id}>
          <div className="flex items-start justify-between gap-3"><span className="grid size-12 place-items-center rounded-brand border-2 border-eel bg-eel/20 text-ecto-dark"><BookCopy aria-hidden="true" size={23} /></span><span className="rounded-brand bg-ecto/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-ecto-dark">Active</span></div>
          <h2 className="mt-5 text-xl font-black leading-tight text-navy">{template.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-ash">{template.description || "Описание шаблона не заполнено."}</p>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-ash"><span className="inline-flex items-center gap-2"><UserRound aria-hidden="true" size={15} /> Автор ID {template.created_by}</span><time>{dateFormatter.format(new Date(template.created_at))}</time></div>
          {can("courses.create") ? <button className="student-pressable mt-auto flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white" onClick={() => { createCourseMutation.reset(); setSelectedTemplate(template); }} type="button">Использовать шаблон <ArrowRight aria-hidden="true" size={18} /></button> : null}
        </article>
      ))}</section> : <section className="grid min-h-72 place-items-center rounded-brand border-2 border-dashed border-line bg-paper p-6 text-center"><div><BookCopy aria-hidden="true" className="mx-auto text-ash" size={38} /><h2 className="mt-3 text-xl font-black text-navy">{templates.length ? "Шаблоны не найдены" : "Шаблонов пока нет"}</h2><p className="mt-2 text-sm text-ash">{templates.length ? "Измените поисковый запрос." : "Создайте первый шаблон из доступного курса."}</p>{templates.length ? <button className="mt-4 text-sm font-black text-macaw-dark hover:underline" onClick={() => setQuery("")} type="button">Сбросить поиск</button> : null}</div></section>}

      {isCreateOpen ? <CreateTemplateDialog courses={coursesQuery.data.results} error={createTemplateMutation.error?.message} isPending={createTemplateMutation.isPending} onClose={() => { createTemplateMutation.reset(); setIsCreateOpen(false); }} onSubmit={(payload) => createTemplateMutation.mutate(payload)} /> : null}
      {selectedTemplate ? <CourseCopyDialog error={createCourseMutation.error?.message} initialCode="" initialTitle={selectedTemplate.title} isPending={createCourseMutation.isPending} onClose={() => { createCourseMutation.reset(); setSelectedTemplate(null); }} onSubmit={(payload) => createCourseMutation.mutate({ templateId: selectedTemplate.id, ...payload })} submitLabel="Создать курс" title={`Новый курс из «${selectedTemplate.title}»`} /> : null}
    </div>
  );
}

interface CreateTemplateDialogProps { courses: CourseListDto[]; error?: string; isPending: boolean; onClose: () => void; onSubmit: (payload: CreateCourseTemplatePayload) => void; }

function CreateTemplateDialog({ courses, error, isPending, onClose, onSubmit }: CreateTemplateDialogProps) {
  const [sourceCourse, setSourceCourse] = useState(String(courses[0]?.id ?? ""));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const isInvalid = !sourceCourse || !title.trim();
  return <div aria-labelledby="create-template-title" aria-modal="true" className="fixed inset-0 z-[115] grid place-items-center bg-midnight/75 p-4" role="dialog"><form className="w-full max-w-xl rounded-brand border-2 border-line bg-paper" onSubmit={(event) => { event.preventDefault(); if (!isInvalid) onSubmit({ title: title.trim(), description: description.trim(), is_active: true, source_course: Number(sourceCourse) }); }}><header className="flex items-start justify-between gap-4 border-b-2 border-line p-5"><div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-ecto-dark">Course Template</span><h2 className="mt-1 text-xl font-black text-navy" id="create-template-title">Создать шаблон</h2></div><button aria-label="Закрыть" className="grid size-10 place-items-center rounded-brand border-2 border-line text-ash hover:bg-mist" disabled={isPending} onClick={onClose} type="button"><X aria-hidden="true" size={18} /></button></header><div className="grid gap-5 p-5"><label className="grid gap-2"><span className="text-xs font-black uppercase tracking-wider text-ash">Исходный курс <span className="text-danger">*</span></span><select className={inputClasses} onChange={(event) => setSourceCourse(event.target.value)} value={sourceCourse}>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} — {course.title}</option>)}</select></label><label className="grid gap-2"><span className="text-xs font-black uppercase tracking-wider text-ash">Название <span className="text-danger">*</span></span><input autoFocus className={inputClasses} maxLength={255} onChange={(event) => setTitle(event.target.value)} value={title} /></label><label className="grid gap-2"><span className="text-xs font-black uppercase tracking-wider text-ash">Описание</span><textarea className={`${inputClasses} min-h-28 py-3`} onChange={(event) => setDescription(event.target.value)} value={description} /></label>{error ? <p className="rounded-brand border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{error}</p> : null}</div><footer className="flex gap-3 border-t-2 border-line p-4 sm:justify-end"><button className="min-h-11 flex-1 rounded-brand border-2 border-line px-5 text-sm font-black text-graphite sm:flex-none" disabled={isPending} onClick={onClose} type="button">Отмена</button><button className="student-pressable min-h-11 flex-1 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white disabled:opacity-50 sm:flex-none" disabled={isInvalid || isPending} type="submit">{isPending ? "Создание…" : "Создать шаблон"}</button></footer></form></div>;
}
