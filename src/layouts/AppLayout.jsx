import { Bell, ChevronDown, GraduationCap, HelpCircle, LogOut, Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { NavLink, useHistory } from "react-router-dom";
import Button from "../components/common/Button";
import Logo from "../components/common/Logo";
import Modal from "../components/common/Modal";
import { mockUser } from "../data/mockUser";

const navigation = [
  { icon: UserRound, label: "Мой профиль", to: "/profile" },
  { icon: GraduationCap, label: "Обучение", to: "/403" },
];

export default function AppLayout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const history = useHistory();
  const initials = `${mockUser.firstName[0]}${mockUser.lastName[0]}`;

  const logout = () => {
    setIsLogoutOpen(false);
    history.push("/login");
  };

  return (
    <div className="su-app-layout">
      <aside className={`su-sidebar${isMenuOpen ? " su-sidebar--open" : ""}`}>
        <div className="su-sidebar__head">
          <Logo compact to="/profile" />
          <button
            aria-label="Закрыть меню"
            className="su-icon-button su-sidebar__close"
            onClick={() => setIsMenuOpen(false)}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <nav className="su-sidebar__nav" aria-label="Основная навигация">
          <span className="su-sidebar__label">Рабочее пространство</span>
          {navigation.map(({ icon: Icon, label, to }) => (
            <NavLink key={to} onClick={() => setIsMenuOpen(false)} to={to}>
              <Icon aria-hidden="true" size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="su-sidebar__support">
          <HelpCircle aria-hidden="true" size={21} />
          <div>
            <strong>Нужна помощь?</strong>
            <span>Учебный офис на связи</span>
          </div>
        </div>

        <button className="su-sidebar__logout" onClick={() => setIsLogoutOpen(true)} type="button">
          <LogOut aria-hidden="true" size={19} />
          Выйти
        </button>
      </aside>

      {isMenuOpen && (
        <button
          aria-label="Закрыть меню"
          className="su-sidebar-backdrop"
          onClick={() => setIsMenuOpen(false)}
          type="button"
        />
      )}

      <div className="su-app-main">
        <header className="su-topbar">
          <button
            aria-label="Открыть меню"
            className="su-icon-button su-topbar__menu"
            onClick={() => setIsMenuOpen(true)}
            type="button"
          >
            <Menu aria-hidden="true" size={21} />
          </button>
          <div className="su-topbar__title">
            <span>Личный кабинет</span>
            <strong>SU LMS</strong>
          </div>
          <div className="su-topbar__actions">
            <button aria-label="Уведомления" className="su-icon-button su-notification-button" type="button">
              <Bell aria-hidden="true" size={20} />
              <span aria-hidden="true" />
            </button>
            <div className="su-user-menu">
              <span className="su-avatar su-avatar--small">{initials}</span>
              <div>
                <strong>{mockUser.firstName} {mockUser.lastName}</strong>
                <span>{mockUser.studentId}</span>
              </div>
              <ChevronDown aria-hidden="true" size={17} />
            </div>
          </div>
        </header>

        {children({ openLogout: () => setIsLogoutOpen(true) })}
      </div>

      <Modal
        description="Текущая демонстрационная сессия будет завершена."
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        title="Выйти из системы?"
      >
        <div className="su-modal__actions">
          <Button onClick={() => setIsLogoutOpen(false)} variant="secondary">
            Отмена
          </Button>
          <Button onClick={logout} variant="danger">
            Выйти
          </Button>
        </div>
      </Modal>
    </div>
  );
}
