export default function Loader({ label = "Загрузка" }) {
  return (
    <span className="su-loader" role="status">
      <span className="su-loader__spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
