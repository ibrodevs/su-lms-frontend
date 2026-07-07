import { CheckCircle2, Circle, Clock3, XCircle } from "lucide-react";
import { getStatusLabel } from "../utils/progress";

export default function ProgressBadge({ progress }) {
  const label = getStatusLabel(progress);
  const icon =
    label === "Сдано" ? (
      <CheckCircle2 size={16} />
    ) : label === "Не сдано" ? (
      <XCircle size={16} />
    ) : label === "В процессе" ? (
      <Clock3 size={16} />
    ) : (
      <Circle size={16} />
    );

  return <span className={`status-badge status-${progress?.status || "new"}`}>{icon}{label}</span>;
}
