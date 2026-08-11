import {
  BookOpen,
  Bell,
  CalendarDays,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Search,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink, useHistory, useLocation } from "react-router-dom";
import ConfirmDialog from "../components/student/ConfirmDialog";
import { mockStudent } from "../data/student/mockStudent";
import { mockNotifications } from "../data/student/mockNotifications";
import { mockCourses } from "../data/student/mockCourses";
import {
  getSidebarCollapsed,
  getStudentLocalState,
  markNotificationRead,
  setAuthenticated,
  setSidebarCollapsed,
  subscribeStudentStorage,
} from "../services/studentStorage";
import { cn } from "../utils/cn";

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
  {
    exact: false,
    icon: CalendarClock,
    label: "Расписание",
    to: "/student/schedule",
  },
  {
    exact: false,
    icon: ClipboardList,
    label: "Задания",
    to: "/student/assignments",
  },
  {
    exact: false,
    icon: CheckSquare,
    label: "Тесты",
    to: "/student/tests",
  },
  {
    exact: false,
    icon: Bell,
    label: "Уведомления",
    to: "/student/notifications",
  },
  { exact: false, icon: UserRound, label: "Профиль", to: "/profile" },
];

function getInitialCollapsedState(): boolean {
  return getSidebarCollapsed();
}

function getPageTitle(pathname: string): string {
  if (pathname === "/profile") return "Профиль";
  if (pathname.includes("/lessons/")) return "Урок";
  if (pathname.startsWith("/student/materials/")) return "Учебный материал";
  if (/^\/student\/courses\/[^/]+$/.test(pathname)) return "Курс";
  if (pathname === "/student/courses") return "Мои курсы";
  if (pathname === "/student/progress") return "Прогресс";
  if (pathname === "/student/calendar") return "Календарь";
  if (pathname === "/student/schedule") return "Расписание";
  if (pathname.startsWith("/student/assignments")) return "Задания";
  if (pathname.startsWith("/student/tests")) return "Тесты";
  if (pathname === "/student/notifications") return "Уведомления";
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const history = useHistory();
  const pageTitle = useMemo(
    () => getPageTitle(location.pathname),
    [location.pathname],
  );
  const initials = `${mockStudent.firstName[0]}${mockStudent.lastName[0]}`;
  const [storageRevision, setStorageRevision] = useState(0);
  useEffect(
    () => subscribeStudentStorage(() => setStorageRevision((value) => value + 1)),
    [],
  );
  const localState = useMemo(getStudentLocalState, [storageRevision]);
  const unreadNotifications = mockNotifications.filter(
    (notification) =>
      !notification.read &&
      !localState.readNotifications.includes(notification.id),
  ).length;
  const recentNotifications = mockNotifications
    .filter(
      (notification) =>
        !localState.deletedNotifications.includes(notification.id),
    )
    .slice(0, 4);
  const searchResults = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return [];

    const navigationResults = navigation
      .filter((item) => item.label.toLowerCase().includes(normalizedQuery))
      .map((item) => ({ label: item.label, meta: "Раздел", to: item.to }));
    const courseResults = mockCourses
      .filter((course) =>
        `${course.title} ${course.code}`.toLowerCase().includes(normalizedQuery),
      )
      .map((course) => ({
        label: course.title,
        meta: course.code,
        to: `/student/courses/${course.id}`,
      }));

    return [...navigationResults, ...courseResults].slice(0, 6);
  }, [searchQuery]);
  const openLogout = useCallback(() => setIsLogoutOpen(true), []);
  const closeLogout = useCallback(() => setIsLogoutOpen(false), []);

  useEffect(() => {
    setIsMobileOpen(false);
    setIsNotificationOpen(false);
    setIsProfileOpen(false);
    setSearchQuery("");
  }, [location.pathname]);

  useEffect(() => {
    setSidebarCollapsed(isCollapsed);
  }, [isCollapsed]);

  const logout = useCallback(() => {
    setIsLogoutOpen(false);
    setAuthenticated(false);
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
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b-2 border-line bg-paper/95 px-4 backdrop-blur sm:px-6 lg:px-8">
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

          <div className="relative ml-auto hidden w-full max-w-sm md:block">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ash"
              size={17}
            />
            <input
              aria-label="Поиск по кабинету"
              className="h-11 w-full rounded-brand border-2 border-line bg-paper pl-10 pr-3 text-sm font-bold text-graphite outline-none focus:border-macaw"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Найти курс или раздел"
              value={searchQuery}
            />
            {searchQuery && (
              <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 grid gap-1 rounded-brand border-2 border-line bg-paper p-2">
                {searchResults.length ? (
                  searchResults.map((result) => (
                    <Link
                      className="flex items-center justify-between gap-3 rounded-brand px-3 py-2 text-sm font-black text-graphite hover:bg-mist"
                      key={`${result.to}-${result.label}`}
                      to={result.to}
                    >
                      <span className="truncate">{result.label}</span>
                      <small className="shrink-0 text-[10px] uppercase tracking-wider text-ash">
                        {result.meta}
                      </small>
                    </Link>
                  ))
                ) : (
                  <span className="px-3 py-2 text-sm font-bold text-ash">
                    Ничего не найдено
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                aria-expanded={isNotificationOpen}
                aria-label="Уведомления"
                className="relative grid size-11 place-items-center rounded-brand border-2 border-line text-ash hover:bg-mist hover:text-graphite"
                onClick={() => {
                  setIsNotificationOpen((value) => !value);
                  setIsProfileOpen(false);
                }}
                type="button"
              >
                <Bell aria-hidden="true" size={19} />
                {unreadNotifications > 0 && (
                  <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-black leading-4 text-white">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              {isNotificationOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 grid w-[min(22rem,calc(100vw-2rem))] gap-2 rounded-brand border-2 border-line bg-paper p-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm font-black text-navy">Уведомления</strong>
                    <Link className="text-xs font-black text-macaw-dark" to="/student/notifications">
                      Показать все
                    </Link>
                  </div>
                  {recentNotifications.map((notification) => {
                    const isRead = notification.read || localState.readNotifications.includes(notification.id);
                    return (
                      <Link
                        className="rounded-brand border-2 border-line p-3 hover:bg-mist"
                        key={notification.id}
                        onClick={() => markNotificationRead(notification.id)}
                        to={notification.target ?? "/student/notifications"}
                      >
                        <span className="flex items-center gap-2 text-xs font-black text-graphite">
                          {!isRead && <span className="size-2 rounded-full bg-ecto" />}
                          {notification.title}
                        </span>
                        <span className="mt-1 block line-clamp-2 text-[11px] leading-4 text-ash">
                          {notification.text}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                aria-expanded={isProfileOpen}
                className="flex min-w-0 items-center gap-3 rounded-brand border-2 border-transparent p-1.5 hover:border-line hover:bg-mist"
                onClick={() => {
                  setIsProfileOpen((value) => !value);
                  setIsNotificationOpen(false);
                }}
                type="button"
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
                <ChevronDown className="hidden text-ash sm:block" size={15} />
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 grid w-56 gap-1 rounded-brand border-2 border-line bg-paper p-2">
                  <Link className="rounded-brand px-3 py-2 text-sm font-black text-graphite hover:bg-mist" to="/profile">
                    Открыть профиль
                  </Link>
                  <button
                    className="rounded-brand px-3 py-2 text-left text-sm font-black text-danger hover:bg-danger/5"
                    onClick={openLogout}
                    type="button"
                  >
                    Выйти
                  </button>
                </div>
              )}
            </div>
          </div>
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
        {navigation.slice(0, 5).map(({ exact, icon: Icon, label, to }) => (
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
        description="Текущая сессия будет завершена. Сохранённый учебный прогресс останется на устройстве."
        isOpen={isLogoutOpen}
        onCancel={closeLogout}
        onConfirm={logout}
        title="Выйти из SU LMS?"
      />
    </div>
  );
}
