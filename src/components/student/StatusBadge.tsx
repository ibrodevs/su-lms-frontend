import { Check, Circle, Clock3, LockKeyhole } from "lucide-react";
import type { CourseStatus, ResolvedLessonStatus } from "../../types/student";
import { cn } from "../../utils/cn";

type Status = CourseStatus | ResolvedLessonStatus;

const labels: Record<Status, string> = {
  "not-started": "Не начат",
  "in-progress": "В процессе",
  completed: "Завершён",
  locked: "Заблокирован",
};

const classes: Record<Status, string> = {
  "not-started": "border-line bg-mist text-ash",
  "in-progress": "border-macaw/30 bg-macaw/10 text-macaw-dark",
  completed: "border-ecto/30 bg-ecto/10 text-ecto-dark",
  locked: "border-line bg-mist text-ash",
};

const icons = {
  "not-started": Circle,
  "in-progress": Clock3,
  completed: Check,
  locked: LockKeyhole,
} satisfies Record<Status, typeof Circle>;

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const Icon = icons[status];

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-brand border-2 px-2.5 py-1 text-[11px] font-extrabold tracking-wide",
        classes[status],
        className,
      )}
    >
      <Icon aria-hidden="true" size={13} strokeWidth={2.5} />
      {labels[status]}
    </span>
  );
}
