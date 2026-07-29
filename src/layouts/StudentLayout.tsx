import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink, useHistory, useLocation } from "react-router-dom";
import ConfirmDialog from "../components/student/ConfirmDialog";
import { mockStudent } from "../data/student/mockStudent";
import { cn } from "../utils/cn";

const SIDEBAR_STORAGE_KEY = "su-lms:student-sidebar-collapsed";

const navigation = [
  { exact: true, icon: Home, label: "Главная", to: "/student" },
  {
    exact: false,
    icon: BookOpen,
    label: "Мои курсы",
    to: "/student/courses",
  },
  {
    exact: false,
    icon: TrendingUp,
    label: "Прогресс",
    to: "/student/progress",
  },
  {
    exact: false,
    icon: CalendarDays,
    label: "Календарь",
    to: "/student/calendar",
  },
  { exact: false, icon: UserRound, label: "Профиль", to: "/profile" },
];

function getInitialCollapsedState(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getPageTitle(pathname: string): string {
  if (pathname === "/profile") return "Профиль";
  if (pathname.includes("/lessons/")) return "Урок";
  if (pathname.startsWith("/student/materials/")) return "Учебный материал";
  if (/^\/student\/courses\/[^/]+$/.test(pathname)) return "Курс";
  if (pathname === "/student/courses") return "Мои курсы";
  if (pathname === "/student/progress") return "Прогресс";
  if (pathname === "/student/calendar") return "Календарь";
  return "Главная";
}

interface StudentLayoutActions {
  openLogout: () => void;
}

interface StudentLayoutProps {
  children: ReactNode | ((actions: StudentLayoutActions) => ReactNode);
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsedState);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const location = useLocation();
  const history = useHistory();
  const pageTitle = useMemo(
    () => getPageTitle(location.pathname),
    [location.pathname],
  );
  const initials = `${mockStudent.firstName[0]}${mockStudent.lastName[0]}`;
  const openLogout = useCallback(() => setIsLogoutOpen(true), []);
  const closeLogout = useCallback(() => setIsLogoutOpen(false), []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SIDEBAR_STORAGE_KEY,
        String(isCollapsed),
      );
    } catch {
      // Sidebar remains usable when storage is unavailable.
    }
  }, [isCollapsed]);

  const logout = useCallback(() => {
    setIsLogoutOpen(false);
    history.push("/login");
  }, [history]);

  return (
    <div className="student-theme">
      {isMobileOpen && (
        <button
          aria-label="Закрыть меню"
          className="fixed inset-0 z-40 bg-midnight/55 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          type="button"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r-2 border-line bg-paper transition-[width,transform] duration-200",
          isCollapsed ? "w-[88px]" : "w-[272px]",
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div
          className={cn(
            "flex h-20 items-center border-b-2 border-line px-5",
            isCollapsed ? "justify-center" : "justify-between",
          )}
        >
          <Link
            aria-label="SU LMS — главная"
            className="flex min-w-0 items-center gap-3"
            to="/student"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-brand border-2 border-ecto-dark bg-ecto text-white">
              <GraduationCap aria-hidden="true" size={24} strokeWidth={2.5} />
            </span>
            {!isCollapsed && (
              <span className="grid leading-none">
                <strong className="text-lg font-black text-navy">SU LMS</strong>
                <small className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-ecto-dark">
                  Student
                </small>
              </span>
            )}
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

        <nav
          aria-label="Навигация кабинета студента"
          className="student-scrollbar grid gap-2 overflow-y-auto p-4"
        >
          {navigation.map(({ exact, icon: Icon, label, to }) => (
            <NavLink
              activeClassName="!border-ecto !bg-ecto/10 !text-ecto-dark"
              aria-label={isCollapsed ? label : undefined}
              className={cn(
                "flex min-h-12 items-center rounded-brand border-2 border-transparent px-3 text-sm font-extrabold text-ash transition-colors hover:border-line hover:bg-mist hover:text-graphite",
                isCollapsed ? "justify-center" : "gap-3",
              )}
              exact={exact}
              key={to}
              title={isCollapsed ? label : undefined}
              to={to}
            >
              <Icon aria-hidden="true" size={21} strokeWidth={2.3} />
              {!isCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto grid gap-2 border-t-2 border-line p-4">
          <button
            className={cn(
              "hidden min-h-11 items-center rounded-brand border-2 border-line text-sm font-extrabold text-ash hover:bg-mist hover:text-graphite lg:flex",
              isCollapsed ? "justify-center" : "gap-3 px-3",
            )}
            onClick={() => setIsCollapsed((current) => !current)}
            type="button"
          >
            {isCollapsed ? (
              <ChevronRight aria-hidden="true" size={19} />
            ) : (
              <>
                <ChevronLeft aria-hidden="true" size={19} />
                Свернуть
              </>
            )}
          </button>
          <button
            className={cn(
              "flex min-h-11 items-center rounded-brand border-2 border-transparent text-sm font-extrabold text-danger hover:border-danger/20 hover:bg-danger/5",
              isCollapsed ? "justify-center" : "gap-3 px-3",
            )}
            onClick={openLogout}
            type="button"
          >
            <LogOut aria-hidden="true" size={19} />
            {!isCollapsed && "Выйти"}
          </button>
        </div>
      </aside>

      <div
        className={cn(
          "min-w-0 transition-[margin] duration-200",
          isCollapsed ? "lg:ml-[88px]" : "lg:ml-[272px]",
        )}
      >
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b-2 border-line bg-paper/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
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
                Кабинет студента
              </span>
              <strong className="block truncate text-lg font-black text-navy">
                {pageTitle}
              </strong>
            </div>
          </div>

          <Link
            className="flex min-w-0 items-center gap-3 rounded-brand border-2 border-transparent p-1.5 hover:border-line hover:bg-mist"
            to="/profile"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-sm font-black text-macaw-dark">
              {initials}
            </span>
            <span className="hidden min-w-0 text-right sm:grid">
              <strong className="truncate text-sm font-black text-graphite">
                {mockStudent.firstName} {mockStudent.lastName}
              </strong>
              <small className="truncate text-[11px] font-bold text-ash">
                {mockStudent.group} · {mockStudent.id}
              </small>
            </span>
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-8 lg:pb-12">
          {typeof children === "function"
            ? children({ openLogout })
            : children}
        </main>
      </div>

      <nav
        aria-label="Мобильная навигация"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t-2 border-line bg-paper px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 lg:hidden"
      >
        {navigation.map(({ exact, icon: Icon, label, to }) => (
          <NavLink
            activeClassName="!text-ecto-dark"
            className="grid min-w-0 justify-items-center gap-1 rounded-brand px-1 py-2 text-[9px] font-black text-ash"
            exact={exact}
            key={to}
            to={to}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={2.3} />
            <span className="max-w-full truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <ConfirmDialog
        confirmLabel="Выйти"
        description="Текущая mock-сессия будет завершена. Сохранённый учебный прогресс останется на устройстве."
        isOpen={isLogoutOpen}
        onCancel={closeLogout}
        onConfirm={logout}
        title="Выйти из SU LMS?"
      />
    </div>
  );
}
