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
import {
  getStudentLocalState,
  saveProfile as persistProfile,
} from "../../services/studentStorage";

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
  const persistedProfile = getStudentLocalState().profile;
  const initialUser = { ...mockUser, ...persistedProfile };
  const [user, setUser] = useState(initialUser);
  const [draft, setDraft] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const history = useHistory();
  const initials = `${user.firstName[0]}${user.lastName[0]}`;
  const fullName = `${user.lastName} ${user.firstName} ${user.middleName}`;

  const openEdit = () => {
    setDraft(user);
    setIsEditing(true);
  };

  const handleSaveProfile = (event) => {
    event.preventDefault();
    setUser(draft);
    persistProfile(draft);
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

      <nav aria-label="Разделы профиля" className="su-profile-tabs" role="tablist">
        {[
          ["personal", "Личные данные"],
          ["academic", "Учебная информация"],
          ["security", "Безопасность"],
          ["settings", "Настройки"],
        ].map(([value, label]) => (
          <button
            aria-selected={activeTab === value}
            className={`su-profile-tab ${activeTab === value ? "is-active" : ""}`}
            key={value}
            onClick={() => setActiveTab(value)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "personal" && <div className="su-profile-grid">
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
      </div>}

      {activeTab === "academic" && (
        <section className="su-panel">
          <span className="su-eyebrow">Обучение</span>
          <h2>Учебная информация</h2>
          <dl className="su-profile-details">
            {["Программа", "Группа", "Курс", "Семестр", "Куратор", "Средний балл"].map((label, index) => (
              <div key={label}><dt>{label}</dt><dd>{[user.program, user.group, "3 курс", user.semester, "Айгүл Токтосунова", "4.6 / 5.0"][index]}</dd></div>
            ))}
          </dl>
        </section>
      )}

      {activeTab === "security" && (
        <section className="su-panel">
          <span className="su-eyebrow">Доступ</span>
          <h2>Безопасность аккаунта</h2>
          <p>Изменение пароля выполняется локально в демонстрационном режиме.</p>
          <Button onClick={() => history.push("/reset-password")} variant="secondary"><LockKeyhole aria-hidden="true" size={17} /> Сменить пароль</Button>
        </section>
      )}

      {activeTab === "settings" && (
        <section className="su-panel">
          <span className="su-eyebrow">Предпочтения</span>
          <h2>Настройки профиля</h2>
          <div className="su-form-grid">
            <label className="su-field"><span className="su-field__label" htmlFor="profile-language">Язык</span><select className="su-input" id="profile-language" value={user.language} onChange={(event) => { const next = { ...user, language: event.target.value }; setUser(next); persistProfile(next); }}><option>Русский</option><option>Кыргызча</option><option>English</option></select></label>
            <label className="su-field"><span className="su-field__label" htmlFor="profile-notifications">Внутренние уведомления</span><select className="su-input" id="profile-notifications"><option>Включены</option><option>Только важные</option><option>Выключены</option></select></label>
          </div>
        </section>
      )}

      <Modal
        description="Можно изменить только личные данные и язык интерфейса."
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Редактирование профиля"
      >
        <form className="su-form" onSubmit={handleSaveProfile}>
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
