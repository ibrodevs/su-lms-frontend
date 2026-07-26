import { ArrowRight, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import PasswordInput from "../../components/common/PasswordInput";
import useDelayedAction from "../../hooks/useDelayedAction";

const credentials = {
  email: "student@su.edu.kg",
  password: "Demo123!",
};

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState("");
  const { execute, isLoading } = useDelayedAction(750);
  const history = useHistory();

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setAuthError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {
      email: form.email.trim() ? "" : "Введите логин или email.",
      password: form.password ? "" : "Введите пароль.",
    };

    setErrors(nextErrors);
    setAuthError("");

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    execute(() => {
      if (form.email.trim() === credentials.email && form.password === credentials.password) {
        history.push("/profile");
        return;
      }

      setAuthError("Неверный логин или пароль.");
    });
  };

  return (
    <>
      <div className="su-auth-card__header">
        <span className="su-eyebrow">Добро пожаловать</span>
        <h2>Вход в SU LMS</h2>
        <p>Введите данные университетской учётной записи.</p>
      </div>

      {authError && (
        <Alert title="Не удалось войти" variant="error">
          {authError}
        </Alert>
      )}

      <form className="su-form" noValidate onSubmit={handleSubmit}>
        <Input
          autoComplete="username"
          error={errors.email}
          icon={Mail}
          id="email"
          label="Логин или email"
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="student@su.edu.kg"
          required
          value={form.email}
        />
        <PasswordInput
          autoComplete="current-password"
          error={errors.password}
          id="password"
          label="Пароль"
          onChange={(event) => updateField("password", event.target.value)}
          placeholder="Введите пароль"
          required
          value={form.password}
        />

        <div className="su-form__options">
          <label className="su-checkbox">
            <input
              checked={form.remember}
              onChange={(event) => updateField("remember", event.target.checked)}
              type="checkbox"
            />
            <span aria-hidden="true" />
            Запомнить меня
          </label>
          <Link className="su-link" to="/forgot-password">
            Забыли пароль?
          </Link>
        </div>

        <Button className="su-button--wide" isLoading={isLoading} type="submit">
          Войти
          <ArrowRight aria-hidden="true" size={18} />
        </Button>
      </form>

      <div className="su-demo-credentials">
        <span>Демо-доступ</span>
        <code>student@su.edu.kg</code>
        <code>Demo123!</code>
      </div>
    </>
  );
}
