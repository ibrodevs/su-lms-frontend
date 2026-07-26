import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

const icons = {
  error: CircleAlert,
  info: Info,
  success: CircleCheck,
};

export default function Alert({ children, onClose, title, variant = "info" }) {
  const Icon = icons[variant] ?? Info;

  return (
    <div className={`su-alert su-alert--${variant}`} role={variant === "error" ? "alert" : "status"}>
      <Icon className="su-alert__icon" aria-hidden="true" size={20} />
      <div>
        {title && <strong>{title}</strong>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button aria-label="Закрыть уведомление" className="su-alert__close" onClick={onClose} type="button">
          <X aria-hidden="true" size={17} />
        </button>
      )}
    </div>
  );
}
