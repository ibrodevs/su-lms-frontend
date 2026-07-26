import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";
import FormError from "./FormError";

export default function PasswordInput({ error, id, label, required = false, ...props }) {
  const [isVisible, setIsVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className={`su-field${error ? " su-field--error" : ""}`}>
      <label className="su-field__label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <div className="su-field__control">
        <LockKeyhole className="su-field__icon" aria-hidden="true" size={19} />
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          className="su-input su-input--password"
          id={id}
          required={required}
          type={isVisible ? "text" : "password"}
          {...props}
        />
        <button
          aria-label={isVisible ? "Скрыть пароль" : "Показать пароль"}
          aria-pressed={isVisible}
          className="su-field__action"
          onClick={() => setIsVisible((current) => !current)}
          type="button"
        >
          {isVisible ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
        </button>
      </div>
      <FormError id={errorId} message={error} />
    </div>
  );
}
