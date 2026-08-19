import { Archive, CheckCircle2, Clock3, FileEdit, RotateCcw } from "lucide-react";
import type { CourseStatus } from "../../api/courses.api";
import { cn } from "../../utils/cn";
import { apiCourseStatusLabels } from "../../utils/courseDisplay";

const classes: Record<CourseStatus, string> = {
  draft: "border-line bg-mist text-ash",
  under_review: "border-warning/40 bg-warning/10 text-warning-dark",
  needs_revision: "border-orange-300 bg-orange-50 text-orange-800",
  published: "border-ecto/40 bg-ecto/10 text-ecto-dark",
  archived: "border-navy/20 bg-navy/5 text-navy",
};

const icons = {
  draft: FileEdit,
  under_review: Clock3,
  needs_revision: RotateCcw,
  published: CheckCircle2,
  archived: Archive,
} satisfies Record<CourseStatus, typeof FileEdit>;

interface ApiCourseStatusBadgeProps {
  status: CourseStatus;
  className?: string;
}

export default function ApiCourseStatusBadge({ status, className }: ApiCourseStatusBadgeProps) {
  const Icon = icons[status];
  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-brand border-2 px-2.5 py-1 text-[11px] font-extrabold tracking-wide", classes[status], className)}>
      <Icon aria-hidden="true" size={13} strokeWidth={2.5} />
      {apiCourseStatusLabels[status]}
    </span>
  );
}
