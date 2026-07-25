export default function PageHeader({ actions, description, eyebrow, title }) {
  return (
    <header className="su-page-header">
      <div>
        {eyebrow && <span className="su-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="su-page-header__actions">{actions}</div>}
    </header>
  );
}
