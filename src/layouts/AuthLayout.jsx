import { ArrowUpRight, BookOpenCheck, ShieldCheck, Sparkles } from "lucide-react";
import Logo from "../components/common/Logo";

const highlights = [
  {
    icon: BookOpenCheck,
    title: "Единое пространство",
    text: "Курсы, материалы и прогресс в одном интерфейсе.",
  },
  {
    icon: ShieldCheck,
    title: "Безопасный доступ",
    text: "Персональный учебный профиль для каждого студента.",
  },
];

export default function AuthLayout({ children }) {
  return (
    <main className="su-auth-layout">
      <section className="su-auth-aside" aria-label="О платформе SU LMS">
        <div className="su-auth-aside__glow" aria-hidden="true" />
        <Logo />

        <div className="su-auth-aside__content">
          <span className="su-pill">
            <Sparkles aria-hidden="true" size={15} />
            Salymbekov University
          </span>
          <h1>Образование, которое движется вместе с вами.</h1>
          <p>
            Современная цифровая среда для обучения, коммуникации и отслеживания академического
            прогресса.
          </p>
        </div>

        <div className="su-auth-highlights">
          {highlights.map(({ icon: Icon, text, title }) => (
            <article key={title}>
              <Icon aria-hidden="true" size={21} />
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>

        <a className="su-auth-aside__link" href="https://salymbekov.com" rel="noreferrer" target="_blank">
          salymbekov.com
          <ArrowUpRight aria-hidden="true" size={16} />
        </a>
      </section>

      <section className="su-auth-main">
        <div className="su-auth-mobile-logo">
          <Logo compact />
        </div>
        <div className="su-auth-card">
          {children}
        </div>
        <p className="su-auth-footer">© 2026 Salymbekov University. Все права защищены.</p>
      </section>
    </main>
  );
}
