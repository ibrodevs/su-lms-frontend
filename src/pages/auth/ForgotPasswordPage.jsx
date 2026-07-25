import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import useDelayedAction from "../../hooks/useDelayedAction";
import { emailPattern } from "../../utils/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { execute, isLoading } = useDelayedAction();

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Введите email.");
      return;
    }

    if (!emailPattern.test(email.trim())) {
      setError("Введите корректный email, например name@domain.com.");
      return;
    }

    setError("");
    execute(() => setIsSuccess(true));
  };

  if (isSuccess) {
    return (
      <div className="su-success-state">
        <span className="su-success-state__icon">
          <Mail aria-hidden="true" size={30} />
        </span>
        <div>
          <span className="su-eyebrow">Проверьте почту</span>
          <h2>Ссылка отправлена</h2>
          <p>
            Ссылка для восстановления пароля отправлена на <strong>{email}</strong>.
          </p>
        </div>
        <Alert variant="success">Для демонстрации письмо не отправляется — продолжите по кнопке ниже.</Alert>
        <Link className="su-button su-button--primary su-button--wide" to="/reset-password">
          Перейти к новому паролю
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
        <button className="su-link-button" onClick={() => setIsSuccess(false)} type="button">
          Указать другой email
        </button>
      </div>
    );
  }

  return (
    <>
      <Link className="su-back-link" to="/login">
        <ArrowLeft aria-hidden="true" size={17} />
        Вернуться ко входу
      </Link>
      <div className="su-auth-card__header">
        <span className="su-eyebrow">Восстановление доступа</span>
        <h2>Забыли пароль?</h2>
        <p>Укажите университетский email — мы покажем следующий шаг восстановления.</p>
      </div>
      <form className="su-form" noValidate onSubmit={handleSubmit}>
        <Input
          autoComplete="email"
          error={error}
          icon={Mail}
          id="recovery-email"
          label="Email"
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
          }}
          placeholder="student@su.edu.kg"
          required
          type="email"
          value={email}
        />
        <Button className="su-button--wide" isLoading={isLoading} type="submit">
          Отправить ссылку
          <ArrowRight aria-hidden="true" size={18} />
        </Button>
      </form>
    </>
  );
}
