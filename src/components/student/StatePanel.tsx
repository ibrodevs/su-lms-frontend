import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatePanelProps {
  title: string;
  description: string;
  kind?: "empty" | "error" | "loading";
  action?: React.ReactNode;
  icon?: LucideIcon;
}

export default function StatePanel({
  title,
  description,
  kind = "empty",
  action,
  icon,
}: StatePanelProps) {
  const DefaultIcon =
    kind === "error" ? AlertTriangle : kind === "loading" ? LoaderCircle : Inbox;
  const Icon = icon ?? DefaultIcon;

  return (
    <section className="grid min-h-64 place-items-center rounded-brand border-2 border-dashed border-line bg-paper p-8 text-center">
      <div className="grid max-w-md justify-items-center gap-3">
        <span className="grid size-14 place-items-center rounded-brand border-2 border-eel bg-ecto/10 text-ecto-dark">
          <Icon
            aria-hidden="true"
            className={kind === "loading" ? "animate-spin" : undefined}
            size={26}
          />
        </span>
        <h2 className="text-xl font-black text-navy">{title}</h2>
        <p className="text-sm leading-6 text-ash">{description}</p>
        {action}
      </div>
    </section>
  );
}
