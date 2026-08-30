import { ArrowRight, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { ApiClientError } from "../../api/errors";
import { getHomePathForRoles } from "../../auth/roles";
import { useAuth } from "../../auth/useAuth";
import { featureFlags } from "../../config/features";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import PasswordInput from "../../components/common/PasswordInput";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const history = useHistory();

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setAuthError("");
  };

  const handleSubmit = async (event) => {
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

    setIsLoading(true);
    try {
      const user = await login({ login: form.email.trim(), password: form.password });
      history.replace(getHomePathForRoles(user.roles));
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "authentication_failed") {
        setAuthError("Неверный логин или пароль.");
      } else if (error instanceof ApiClientError) {
        setAuthError(error.message);
      } else {
        setAuthError("Сервис авторизации временно недоступен.");
      }
    } finally {
      setIsLoading(false);
    }
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
          <span />
          {featureFlags.passwordRecovery ? <Link className="su-link" to="/forgot-password">Забыли пароль?</Link> : null}
        </div>

        <Button className="su-button--wide" isLoading={isLoading} type="submit">
          Войти
          <ArrowRight aria-hidden="true" size={18} />
        </Button>
      </form>

      <div className="su-demo-credentials">
        <span>Демо-доступ</span>
        <code>student@su.edu.kg</code>
        <code>teacher@su.edu.kg</code>
        <code>content@su.edu.kg</code>
        <code>admin@su.edu.kg</code>
        <code>Demo123!</code>
      </div>
    </>
  );
}
