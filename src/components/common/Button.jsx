import Loader from "./Loader";

export default function Button({
  children,
  className = "",
  disabled = false,
  isLoading = false,
  variant = "primary",
  type = "button",
  ...props
}) {
  return (
    <button
      className={`su-button su-button--${variant} ${className}`.trim()}
      disabled={isLoading || disabled}
      type={type}
      {...props}
    >
      {isLoading && <Loader label="Выполняется" />}
      <span>{children}</span>
    </button>
  );
}
