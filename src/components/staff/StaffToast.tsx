import { CheckCircle2, X, XCircle } from "lucide-react";
import { useEffect } from "react";

export interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  variant?: "success" | "error";
}

interface StaffToastProps {
  message: ToastMessage | null;
  onClose: () => void;
}

export default function StaffToast({ message, onClose }: StaffToastProps) {
  useEffect(() => {
    if (!message) return;
    const timeoutId = window.setTimeout(onClose, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [message, onClose]);

  if (!message) return null;
  const isError = message.variant === "error";
  const Icon = isError ? XCircle : CheckCircle2;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[120] flex w-[min(390px,calc(100%-2rem))] items-start gap-3 rounded-brand border-2 border-line bg-paper p-4"
      role="status"
    >
      <Icon
        aria-hidden="true"
        className={isError ? "text-danger" : "text-ecto-dark"}
        size={22}
      />
      <div className="min-w-0 flex-1">
        <strong className="block text-sm font-black text-graphite">{message.title}</strong>
        {message.description ? (
          <p className="mt-1 text-xs leading-5 text-ash">{message.description}</p>
        ) : null}
      </div>
      <button
        aria-label="Закрыть уведомление"
        className="grid size-8 shrink-0 place-items-center rounded-brand text-ash hover:bg-mist hover:text-graphite"
        onClick={onClose}
        type="button"
      >
        <X aria-hidden="true" size={16} />
      </button>
    </div>
  );
}
