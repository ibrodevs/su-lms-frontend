import { Check, ChevronRight } from "lucide-react";
import type { CourseStatus } from "../../types/staff";
import { courseStatusLabels } from "../../utils/staffDisplay";

interface CourseLifecycleProps {
  status: CourseStatus;
}

const statuses: CourseStatus[] = ["draft", "under-review", "published", "archived"];

export default function CourseLifecycle({ status }: CourseLifecycleProps) {
  const activeIndex = statuses.indexOf(status);

  return (
    <section aria-label="Жизненный цикл курса" className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7">
      <div>
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-ecto-dark">Course lifecycle</span>
        <h2 className="mt-1 text-xl font-black text-navy">Статус публикации</h2>
        <p className="mt-1 text-xs text-ash">Курс проходит последовательные этапы подготовки и публикации.</p>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center">
        {statuses.map((item, index) => {
          const isActive = item === status;
          const isComplete = index < activeIndex;
          return (
            <li className="contents" key={item}>
              <span
                aria-current={isActive ? "step" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-brand border-2 px-3 text-xs font-black ${
                  isActive
                    ? "border-macaw bg-macaw/10 text-macaw-dark"
                    : isComplete
                      ? "border-ecto/40 bg-ecto/10 text-ecto-dark"
                      : "border-line bg-mist text-ash"
                }`}
              >
                <span className={`grid size-7 shrink-0 place-items-center rounded-full ${isActive ? "bg-macaw text-white" : isComplete ? "bg-ecto text-white" : "bg-paper"}`}>
                  {isComplete ? <Check aria-hidden="true" size={14} /> : index + 1}
                </span>
                {courseStatusLabels[item]}
              </span>
              {index < statuses.length - 1 ? (
                <ChevronRight aria-hidden="true" className="mx-auto hidden text-line sm:block" size={18} />
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
