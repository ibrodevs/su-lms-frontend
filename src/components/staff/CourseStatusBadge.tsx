import { Archive, CheckCircle2, Clock3, FileEdit } from "lucide-react";
import type { CourseStatus } from "../../types/staff";
import { cn } from "../../utils/cn";
import { courseStatusLabels } from "../../utils/staffDisplay";

const classes: Record<CourseStatus, string> = {
  draft: "border-line bg-mist text-ash",
  "under-review": "border-warning/40 bg-warning/10 text-warning-dark",
  published: "border-ecto/40 bg-ecto/10 text-ecto-dark",
  archived: "border-navy/20 bg-navy/5 text-navy",
};

const icons = {
  draft: FileEdit,
  "under-review": Clock3,
  published: CheckCircle2,
  archived: Archive,
} satisfies Record<CourseStatus, typeof FileEdit>;

interface CourseStatusBadgeProps {
  status: CourseStatus;
  className?: string;
}

export default function CourseStatusBadge({ status, className }: CourseStatusBadgeProps) {
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
      {courseStatusLabels[status]}
    </span>
  );
}
