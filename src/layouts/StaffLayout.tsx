import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  FileCheck2,
  Files,
  GraduationCap,
  Home,
  LayoutTemplate,
  LogOut,
  Menu,
  Plus,
  Search,
  Users,
  X,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, NavLink, useHistory, useLocation } from "react-router-dom";
import { getHomePathForRoles, getStaffRole } from "../auth/roles";
import { useAuth } from "../auth/useAuth";
import ConfirmDialog from "../components/student/ConfirmDialog";
import { cn } from "../utils/cn";
import { staffRoleLabels } from "../utils/staffDisplay";

const pageTitles: Array<[RegExp, string]> = [
  [/^\/(teacher|content|admin)$/, "Рабочий стол"],
  [/^\/admin\/users$/, "Пользователи"],
  [/^\/courses\/create$/, "Создание курса"],
  [/^\/courses\/[^/]+\/edit$/, "Редактирование курса"],
  [/^\/courses\/[^/]+\/builder$/, "Структура курса"],
  [/^\/courses\/[^/]+\/lessons\/[^/]+\/edit$/, "Редактор урока"],
  [/^\/courses\/[^/]+$/, "Карточка курса"],
  [/^\/courses$/, "Курсы"],
  [/^\/calendar$/, "Календарь"],
  [/^\/materials$/, "Материалы"],
  [/^\/templates$/, "Шаблоны"],
  [/^\/profile$/, "Профиль"],
];

interface StaffLayoutActions {
  openLogout: () => void;
}

interface StaffLayoutProps {
  children: ReactNode | ((actions: StaffLayoutActions) => ReactNode);
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  const history = useHistory();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { can, logout: logoutSession, user } = useAuth();
  const role = getStaffRole(user?.roles ?? []) ?? "teacher";
  const dashboardPath = getHomePathForRoles(user?.roles ?? []);
  const pageTitle =
    pageTitles.find(([pattern]) => pattern.test(location.pathname))?.[1] ?? "SU LMS";

  const navigation = useMemo(() => {
    const items = [
      { icon: Home, label: "Главная", to: dashboardPath, exact: true },
      {
        icon: BookOpen,
        label: role === "teacher" ? "Мои курсы" : "Все курсы",
        to: "/courses",
        exact: true,
      },
      { icon: Files, label: "Материалы", to: "/materials", exact: true },
    ];
    if (can("calendar.view")) {
      items.push({
        icon: CalendarDays,
        label: "Календарь",
        to: "/calendar",
        exact: true,
      });
    }
    if (can("courses.copy")) {
      items.push({
        icon: LayoutTemplate,
        label: "Шаблоны",
        to: "/templates",
        exact: true,
      });
    }
    if (can("courses.review")) {
      items.push({
        icon: FileCheck2,
        label: "Курсы на проверке",
        to: "/courses?status=under_review",
        exact: false,
      });
    }
    if (role === "admin") {
      items.push({
        icon: Users,
        label: "Пользователи",
        to: "/admin/users",
        exact: true,
      });
    }
    return items;
  }, [can, dashboardPath, role]);

  useEffect(() => {
    setIsMobileOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname, location.search]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    history.push(query ? `/courses?q=${encodeURIComponent(query)}` : "/courses");
  };

  const logout = async () => {
    try {
      await logoutSession();
    } finally {
      setIsLogoutOpen(false);
      history.replace("/login");
    }
  };

  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}` || "SU"
    : "SU";

  return (
    <div className="student-theme staff-theme min-h-screen bg-paper">
      {isMobileOpen ? (
        <button
          aria-label="Закрыть меню"
          className="fixed inset-0 z-40 bg-midnight/60 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r-2 border-line bg-paper transition-transform lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 items-center justify-between border-b-2 border-line px-5">
          <Link className="flex items-center gap-3" to={dashboardPath}>
            <span className="grid size-11 place-items-center rounded-brand border-2 border-ecto-dark bg-ecto text-white">
              <GraduationCap aria-hidden="true" size={24} strokeWidth={2.5} />
            </span>
            <span className="grid leading-none">
              <strong className="text-lg font-black text-navy">SU LMS</strong>
              <small className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-ecto-dark">
                {staffRoleLabels[role]}
              </small>
            </span>
          </Link>
          <button
            aria-label="Закрыть меню"
            className="grid size-10 place-items-center rounded-brand border-2 border-line text-ash lg:hidden"
            onClick={() => setIsMobileOpen(false)}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <nav aria-label="Навигация кабинета сотрудника" className="grid gap-2 p-4">
          {navigation.map(({ exact, icon: Icon, label, to }) => (
            <NavLink
              activeClassName="!border-ecto !bg-ecto/10 !text-ecto-dark"
              className="flex min-h-12 items-center gap-3 rounded-brand border-2 border-transparent px-3 text-sm font-extrabold text-ash transition-colors hover:border-line hover:bg-mist hover:text-graphite"
              exact={exact}
              key={to}
              to={to}
            >
              <Icon aria-hidden="true" size={21} strokeWidth={2.3} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t-2 border-line p-4">
          <button
            className="flex min-h-11 w-full items-center gap-3 rounded-brand border-2 border-transparent px-3 text-sm font-extrabold text-danger hover:border-danger/20 hover:bg-danger/5"
            onClick={() => setIsLogoutOpen(true)}
            type="button"
          >
            <LogOut aria-hidden="true" size={19} />
            Выйти
          </button>
        </div>
      </aside>

      <div className="min-w-0 lg:ml-[280px]">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b-2 border-line bg-paper/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            aria-label="Открыть меню"
            className="grid size-11 shrink-0 place-items-center rounded-brand border-2 border-line text-graphite lg:hidden"
            onClick={() => setIsMobileOpen(true)}
            type="button"
          >
            <Menu aria-hidden="true" size={21} />
          </button>
          <div className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-ecto-dark">
              Кабинет сотрудника
            </span>
            <strong className="block truncate text-lg font-black text-navy">{pageTitle}</strong>
          </div>

          <form className="relative ml-auto hidden w-full max-w-sm md:block" onSubmit={handleSearch}>
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ash"
              size={17}
            />
            <input
              aria-label="Поиск курсов"
              className="h-11 w-full rounded-brand border-2 border-line bg-paper pl-10 pr-3 text-sm font-bold text-graphite outline-none focus:border-macaw"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Название или код курса"
              value={searchQuery}
            />
          </form>

          {can("courses.create") ? (
            <Link
              aria-label="Создать курс"
              className="student-pressable hidden min-h-11 items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white sm:flex"
              to="/courses/create"
            >
              <Plus aria-hidden="true" size={18} />
              Создать
            </Link>
          ) : null}

          <div className="relative">
            <button
              aria-expanded={isProfileOpen}
              className="flex h-11 items-center gap-2 rounded-brand border-2 border-line px-2 text-left hover:bg-mist"
              onClick={() => setIsProfileOpen((current) => !current)}
              type="button"
            >
              <span className="grid size-8 place-items-center rounded-brand bg-navy text-xs font-black text-white">
                {initials}
              </span>
              <span className="hidden max-w-32 truncate text-xs font-black text-graphite xl:block">
                {user?.first_name} {user?.last_name}
              </span>
              <ChevronDown aria-hidden="true" className="text-ash" size={15} />
            </button>
            {isProfileOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-brand border-2 border-line bg-paper p-3">
                <strong className="block text-sm font-black text-graphite">
                  {user?.first_name} {user?.last_name}
                </strong>
                <span className="mt-1 block text-xs text-ash">{user?.email}</span>
                <span className="mt-3 inline-flex rounded-brand border-2 border-eel bg-eel/20 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-ecto-dark">
                  {staffRoleLabels[role]}
                </span>
                <Link className="mt-3 flex min-h-10 items-center gap-2 rounded-brand border-2 border-line px-3 text-xs font-black text-graphite hover:border-macaw" to="/profile"><UserRound aria-hidden="true" size={16} /> Открыть профиль</Link>
              </div>
            ) : null}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {typeof children === "function"
            ? children({ openLogout: () => setIsLogoutOpen(true) })
            : children}
        </main>
      </div>

      <ConfirmDialog
        confirmLabel="Выйти"
        description="Текущая сессия будет завершена на сервере."
        isOpen={isLogoutOpen}
        onCancel={() => setIsLogoutOpen(false)}
        onConfirm={logout}
        title="Выйти из SU LMS?"
      />
    </div>
  );
}
