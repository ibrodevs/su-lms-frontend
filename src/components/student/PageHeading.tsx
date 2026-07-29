import type { ReactNode } from "react";

interface PageHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: PageHeadingProps) {
  return (
    <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div className="max-w-3xl">
        {eyebrow && (
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-ecto-dark">
            {eyebrow}
          </span>
        )}
        <h1 className="text-3xl font-black tracking-tight text-navy sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ash sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}
