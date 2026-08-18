import {
  ArrowRight,
  BookCopy,
  FileText,
  Layers3,
  Search,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { mockStaffUsers } from "../../data/mock/mockUsers";
import { useMockLoading } from "../../hooks/useMockLoading";
import {
  filterCourseTemplates,
  getCourseTemplates,
  getCourseTemplateStats,
} from "../../services/courseTemplateService";
import { useLegacyStaffSession } from "../../auth/useLegacyStaffSession";

export default function StaffTemplatesPage() {
  const session = useLegacyStaffSession();
  const [query, setQuery] = useState("");
  const isLoading = useMockLoading();
  const templates = useMemo(() => getCourseTemplates(), []);
  const filteredTemplates = useMemo(
    () => filterCourseTemplates(templates, query),
    [query, templates],
  );

  if (!session || session.role === "teacher") {
    return (
      <section className="grid min-h-96 place-items-center rounded-brand border-2 border-line bg-paper p-6 text-center">
        <div>
          <BookCopy aria-hidden="true" className="mx-auto text-ash" size={40} />
          <h1 className="mt-4 text-2xl font-black text-navy">Шаблоны недоступны</h1>
          <p className="mt-2 text-sm text-ash">Работа с шаблонами доступна Content Manager и LMS Admin.</p>
          <Link className="mt-4 inline-block text-sm font-black text-macaw-dark hover:underline" to="/courses">Вернуться к курсам</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Course Templates</span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">Шаблоны курсов</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ash">Используйте готовую структуру или создайте пустой курс с нуля.</p>
        </div>
        <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-line px-5 text-sm font-black text-graphite hover:border-lingot hover:bg-eel/10" to="/courses/create">
          <FileText aria-hidden="true" size={18} />
          Пустой курс
        </Link>
      </header>

      <label className="relative block max-w-2xl">
        <span className="sr-only">Поиск шаблонов</span>
        <Search aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-ash" size={19} />
        <input
          className="h-12 w-full rounded-brand border-2 border-line bg-paper pl-11 pr-4 text-sm font-bold text-graphite outline-none focus:border-macaw"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Название или описание шаблона"
          value={query}
        />
      </label>

      {isLoading ? (
        <div aria-label="Загрузка шаблонов" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => <div className="h-80 animate-pulse rounded-brand bg-mist" key={item} />)}
        </div>
      ) : filteredTemplates.length ? (
        <section aria-label="Список шаблонов" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => {
            const stats = getCourseTemplateStats(template);
            const creator = mockStaffUsers.find((user) => user.id === template.creatorId);
            return (
              <article className="flex min-h-80 flex-col rounded-brand border-2 border-line bg-paper p-5" key={template.id}>
                <div className="grid size-12 place-items-center rounded-brand border-2 border-eel bg-eel/20 text-ecto-dark">
                  <BookCopy aria-hidden="true" size={23} />
                </div>
                <h2 className="mt-5 text-xl font-black leading-tight text-navy">{template.name}</h2>
                <p className="mt-3 text-sm leading-6 text-ash">{template.description}</p>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-brand bg-mist p-3"><dt className="flex items-center gap-2 font-bold text-ash"><Layers3 aria-hidden="true" size={15} />Модули</dt><dd className="mt-1 text-lg font-black text-graphite">{stats.moduleCount}</dd></div>
                  <div className="rounded-brand bg-mist p-3"><dt className="flex items-center gap-2 font-bold text-ash"><FileText aria-hidden="true" size={15} />Уроки</dt><dd className="mt-1 text-lg font-black text-graphite">{stats.lessonCount}</dd></div>
                </dl>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-ash">
                  <UserRound aria-hidden="true" size={15} />
                  {creator ? `${creator.firstName} ${creator.lastName}` : "Команда SU LMS"}
                </div>
                <Link className="student-pressable mt-auto flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white" to={`/courses/create?template=${template.id}`}>
                  Использовать шаблон
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="grid min-h-72 place-items-center rounded-brand border-2 border-dashed border-line bg-paper p-6 text-center">
          <div>
            <Search aria-hidden="true" className="mx-auto text-ash" size={36} />
            <h2 className="mt-3 text-xl font-black text-navy">Шаблоны не найдены</h2>
            <p className="mt-2 text-sm text-ash">Измените поисковый запрос.</p>
            <button className="mt-4 text-sm font-black text-macaw-dark hover:underline" onClick={() => setQuery("")} type="button">Сбросить поиск</button>
          </div>
        </section>
      )}
    </div>
  );
}
