import { ArrowLeft, ArrowRight, LockKeyhole, SearchX } from "lucide-react";
import { Link, useHistory } from "react-router-dom";
import Button from "../../components/common/Button";
import Logo from "../../components/common/Logo";

export default function ErrorPage({ code, description, title }) {
  const history = useHistory();
  const Icon = code === "403" ? LockKeyhole : SearchX;

  return (
    <main className="su-error-page">
      <header>
        <Logo compact />
      </header>
      <section className="su-error-card">
        <div className="su-error-card__visual" aria-hidden="true">
          <span>{code}</span>
          <Icon size={42} />
        </div>
        <span className="su-eyebrow">Ошибка {code}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="su-error-card__actions">
          <Button onClick={() => history.goBack()} variant="secondary">
            <ArrowLeft aria-hidden="true" size={17} />
            Вернуться назад
          </Button>
          <Link className="su-button su-button--primary" to="/profile">
            На главную
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </section>
      <footer>SU LMS · Salymbekov University</footer>
    </main>
  );
}
