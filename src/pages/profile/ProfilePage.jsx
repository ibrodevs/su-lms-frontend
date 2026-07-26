import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  Languages,
  LockKeyhole,
  LogOut,
  Mail,
  Pencil,
  Save,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import Alert from "../../components/common/Alert";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import PageHeader from "../../components/common/PageHeader";
import { mockUser } from "../../data/mockUser";

const profileDetails = [
  { icon: Mail, label: "Email", key: "email" },
  { icon: GraduationCap, label: "Student ID", key: "studentId" },
  { icon: BriefcaseBusiness, label: "Роль", key: "role" },
  { icon: Building2, label: "Факультет", key: "faculty" },
  { icon: BookOpen, label: "Программа", key: "program" },
  { icon: UserRound, label: "Группа", key: "group" },
  { icon: Languages, label: "Язык интерфейса", key: "language" },
];

export default function ProfilePage({ openLogout }) {
  const [user, setUser] = useState(mockUser);
  const [draft, setDraft] = useState(mockUser);
  const [isEditing, setIsEditing] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const history = useHistory();
  const initials = `${user.firstName[0]}${user.lastName[0]}`;
  const fullName = `${user.lastName} ${user.firstName} ${user.middleName}`;

  const openEdit = () => {
    setDraft(user);
    setIsEditing(true);
  };

  const saveProfile = (event) => {
    event.preventDefault();
    setUser(draft);
    setIsEditing(false);
    setShowSaved(true);
  };

  return (
    <main className="su-page">
      <Breadcrumbs items={[{ label: "Личный кабинет", to: "/profile" }, { label: "Мой профиль" }]} />
      <PageHeader
        actions={
          <Button onClick={openEdit} variant="secondary">
            <Pencil aria-hidden="true" size={17} />
            Редактировать профиль
          </Button>
        }
        description="Личные и академические данные вашей учётной записи."
        eyebrow="Личный кабинет"
        title="Мой профиль"
      />

      {showSaved && (
        <Alert onClose={() => setShowSaved(false)} title="Изменения сохранены" variant="success">
          Изменения профиля сохранены.
        </Alert>
      )}

      <section className="su-profile-hero">
        <div className="su-profile-hero__identity">
          <span className="su-avatar">{initials}</span>
          <div>
            <span className="su-status">
              <span aria-hidden="true" />
              Активный студент
            </span>
            <h2>{fullName}</h2>
            <p>{user.program} · {user.group}</p>
          </div>
        </div>
        <div className="su-profile-hero__meta">
          <span>Student ID</span>
          <strong>{user.studentId}</strong>
        </div>
      </section>

      <div className="su-profile-grid">
        <section className="su-panel">
          <header className="su-panel__header">
            <div>
              <span className="su-eyebrow">Учётная запись</span>
              <h2>Персональная информация</h2>
            </div>
          </header>
          <dl className="su-profile-details">
            {profileDetails.map(({ icon: Icon, key, label }) => (
              <div key={key}>
                <dt>
                  <Icon aria-hidden="true" size={18} />
                  {label}
                </dt>
                <dd>{user[key]}</dd>
              </div>
            ))}
          </dl>
        </section>

        <aside className="su-profile-actions">
          <section className="su-panel">
            <span className="su-eyebrow">Безопасность</span>
            <h2>Пароль и доступ</h2>
            <p>Обновляйте пароль регулярно, чтобы защитить учётную запись.</p>
            <Button className="su-button--wide" onClick={() => history.push("/reset-password")} variant="secondary">
              <LockKeyhole aria-hidden="true" size={17} />
              Сменить пароль
            </Button>
          </section>
          <section className="su-panel su-panel--danger">
            <span className="su-eyebrow">Сессия</span>
            <h2>Завершить работу</h2>
            <p>Выйдите из системы, если используете общее устройство.</p>
            <Button className="su-button--wide" onClick={openLogout} variant="danger">
              <LogOut aria-hidden="true" size={17} />
              Выйти
            </Button>
          </section>
        </aside>
      </div>

      <Modal
        description="Можно изменить только личные данные и язык интерфейса."
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Редактирование профиля"
      >
        <form className="su-form" onSubmit={saveProfile}>
          <div className="su-form-grid">
            <Input
              id="last-name"
              label="Фамилия"
              onChange={(event) => setDraft((current) => ({ ...current, lastName: event.target.value }))}
              required
              value={draft.lastName}
            />
            <Input
              id="first-name"
              label="Имя"
              onChange={(event) => setDraft((current) => ({ ...current, firstName: event.target.value }))}
              required
              value={draft.firstName}
            />
          </div>
          <Input
            id="middle-name"
            label="Отчество"
            onChange={(event) => setDraft((current) => ({ ...current, middleName: event.target.value }))}
            value={draft.middleName}
          />
          <div className="su-field">
            <label className="su-field__label" htmlFor="language">
              Язык интерфейса
            </label>
            <select
              className="su-input"
              id="language"
              onChange={(event) => setDraft((current) => ({ ...current, language: event.target.value }))}
              value={draft.language}
            >
              <option>Русский</option>
              <option>Кыргызча</option>
              <option>English</option>
            </select>
          </div>
          <div className="su-modal__actions">
            <Button onClick={() => setIsEditing(false)} variant="secondary">
              Отмена
            </Button>
            <Button type="submit">
              <Save aria-hidden="true" size={17} />
              Сохранить
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
