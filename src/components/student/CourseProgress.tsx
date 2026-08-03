interface CourseProgressProps {
  percent: number;
  compact?: boolean;
  label?: string;
}

export default function CourseProgress({
  percent,
  compact = false,
  label = "Прогресс",
}: CourseProgressProps) {
  const safePercent = Math.min(100, Math.max(0, percent));

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-4 text-xs font-extrabold tracking-wide text-ash">
        <span>{label}</span>
        <span className="text-graphite">{safePercent}%</span>
      </div>
      <div
        aria-label={`${label}: ${safePercent}%`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={safePercent}
        className={compact ? "h-2 rounded-brand bg-line" : "h-3 rounded-brand bg-line"}
        role="progressbar"
      >
        <div
          className="h-full rounded-brand bg-ecto transition-[width] duration-300"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
}
