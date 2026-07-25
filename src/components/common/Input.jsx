import FormError from "./FormError";

export default function Input({
  error,
  hint,
  icon: Icon,
  id,
  label,
  required = false,
  ...props
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={`su-field${error ? " su-field--error" : ""}`}>
      <label className="su-field__label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <div className="su-field__control">
        {Icon && <Icon className="su-field__icon" aria-hidden="true" size={19} />}
        <input
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className="su-input"
          id={id}
          required={required}
          {...props}
        />
      </div>
      {hint && !error && (
        <p className="su-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      <FormError id={errorId} message={error} />
    </div>
  );
}
