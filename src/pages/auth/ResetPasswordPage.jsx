import { ArrowLeft, ArrowRight, Check, KeyRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import PasswordInput from "../../components/common/PasswordInput";
import useDelayedAction from "../../hooks/useDelayedAction";
import { isValidPassword, passwordRules } from "../../utils/validation";

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ password: "", confirmation: "" });
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const { execute, isLoading } = useDelayedAction();

  const ruleStates = useMemo(
    () => passwordRules.map((rule) => ({ ...rule, isValid: rule.test(form.password) })),
    [form.password],
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.password) {
      nextErrors.password = "Введите новый пароль.";
    } else if (!isValidPassword(form.password)) {
      nextErrors.password = "Пароль не соответствует требованиям.";
    }

    if (!form.confirmation) {
      nextErrors.confirmation = "Повторите новый пароль.";
    } else if (form.password !== form.confirmation) {
      nextErrors.confirmation = "Пароли не совпадают.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      execute(() => setIsSuccess(true));
    }
  };

  if (isSuccess) {
    return (
      <div className="su-success-state">
        <span className="su-success-state__icon">
          <KeyRound aria-hidden="true" size={30} />
        </span>
        <div>
          <span className="su-eyebrow">Готово</span>
          <h2>Пароль изменён</h2>
          <p>Теперь вы можете войти в SU LMS с новым паролем.</p>
        </div>
        <Alert variant="success">Пароль успешно изменён.</Alert>
        <Link className="su-button su-button--primary su-button--wide" to="/login">
          Перейти ко входу
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
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
        <span className="su-eyebrow">Защита аккаунта</span>
        <h2>Новый пароль</h2>
        <p>Придумайте надёжный пароль и подтвердите его.</p>
      </div>

      <form className="su-form" noValidate onSubmit={handleSubmit}>
        <PasswordInput
          autoComplete="new-password"
          error={errors.password}
          id="new-password"
          label="Новый пароль"
          onChange={(event) => updateField("password", event.target.value)}
          placeholder="Минимум 8 символов"
          required
          value={form.password}
        />

        <ul className="su-password-rules" aria-label="Требования к паролю">
          {ruleStates.map((rule) => (
            <li className={rule.isValid ? "is-valid" : ""} key={rule.id}>
              <Check aria-hidden="true" size={14} />
              {rule.label}
            </li>
          ))}
        </ul>

        <PasswordInput
          autoComplete="new-password"
          error={errors.confirmation}
          id="confirm-password"
          label="Подтверждение пароля"
          onBlur={() => {
            if (form.confirmation && form.password !== form.confirmation) {
              setErrors((current) => ({ ...current, confirmation: "Пароли не совпадают." }));
            }
          }}
          onChange={(event) => updateField("confirmation", event.target.value)}
          placeholder="Повторите пароль"
          required
          value={form.confirmation}
        />

        <Button className="su-button--wide" isLoading={isLoading} type="submit">
          Сохранить новый пароль
          <ArrowRight aria-hidden="true" size={18} />
        </Button>
      </form>
    </>
  );
}
