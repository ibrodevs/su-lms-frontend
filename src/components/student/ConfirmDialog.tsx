import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    cancelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      aria-labelledby="student-confirm-title"
      aria-modal="true"
      className="fixed inset-0 z-[100] grid place-items-center bg-midnight/70 p-4"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-brand border-2 border-line bg-paper p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-xl font-black text-navy"
              id="student-confirm-title"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ash">{description}</p>
          </div>
          <button
            aria-label="Закрыть"
            className="grid size-10 shrink-0 place-items-center rounded-brand border-2 border-line text-ash hover:bg-mist hover:text-graphite"
            onClick={onCancel}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="student-pressable rounded-brand border-2 border-line bg-paper px-4 py-3 text-sm font-black text-graphite"
            onClick={onCancel}
            ref={cancelRef}
            type="button"
          >
            Отмена
          </button>
          <button
            className="student-pressable rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-3 text-sm font-black text-white"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
