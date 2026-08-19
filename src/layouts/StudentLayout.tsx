import {
  BookOpen,
  CalendarDays,
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
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink, useHistory, useLocation } from "react-router-dom";
import { studentApi } from "../api/student.api";
import type { StudentCourseDto, StudentCourseListParams } from "../api/student.api";
import { studentKeys } from "../api/studentKeys";
import { useAuth } from "../auth/useAuth";
import ConfirmDialog from "../components/student/ConfirmDialog";
import { getSidebarCollapsed, setSidebarCollapsed } from "../services/uiPreferences";
import { cn } from "../utils/cn";

const courseListParams: StudentCourseListParams = { pageSize: 100 };
const emptyCourses: readonly StudentCourseDto[] = [];

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const history = useHistory();
  const { logout: logoutSession, user } = useAuth();
  const pageTitle = useMemo(
    () => getPageTitle(location.pathname),
    [location.pathname],
  );
  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}` || "SU"
    : "SU";
  const coursesQuery = useQuery({
    enabled: searchQuery.trim().length > 0,
    queryKey: studentKeys.courses(courseListParams),
    queryFn: () => studentApi.courses(courseListParams),
  });
  const searchableCourses = coursesQuery.data?.results ?? emptyCourses;
  const searchResults = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return [];

    const navigationResults = navigation
      .filter((item) => item.label.toLowerCase().includes(normalizedQuery))
      .map((item) => ({ label: item.label, meta: "Раздел", to: item.to }));
    const courseResults = searchableCourses
      .filter((course) =>
        `${course.title} ${course.code}`.toLowerCase().includes(normalizedQuery),
      )
      .map((course) => ({
        label: course.title,
        meta: course.code,
        to: `/student/courses/${course.id}`,
      }));

    return [...navigationResults, ...courseResults].slice(0, 6);
  }, [searchQuery, searchableCourses]);
  const openLogout = useCallback(() => setIsLogoutOpen(true), []);
  const closeLogout = useCallback(() => setIsLogoutOpen(false), []);

  useEffect(() => {
    setIsMobileOpen(false);
    setIsProfileOpen(false);
    setSearchQuery("");
  }, [location.pathname]);

  useEffect(() => {
    setSidebarCollapsed(isCollapsed);
  }, [isCollapsed]);

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } finally {
      setIsLogoutOpen(false);
      history.replace("/login");
    }
  }, [history, logoutSession]);

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
                ) : coursesQuery.isFetching ? (
                  <span className="px-3 py-2 text-sm font-bold text-ash">
                    Ищем курсы…
                  </span>
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
                aria-expanded={isProfileOpen}
                className="flex min-w-0 items-center gap-3 rounded-brand border-2 border-transparent p-1.5 hover:border-line hover:bg-mist"
                onClick={() => setIsProfileOpen((value) => !value)}
                type="button"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-sm font-black text-macaw-dark">
                  {initials}
                </span>
                <span className="hidden min-w-0 text-right sm:grid">
                  <strong className="truncate text-sm font-black text-graphite">
                    {user?.first_name} {user?.last_name}
                  </strong>
                  <small className="truncate text-[11px] font-bold text-ash">
                    {user?.profile?.group ?? "Группа не указана"} · {user?.profile?.student_id ?? "ID не указан"}
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
        description="Текущая сессия будет завершена на сервере."
        isOpen={isLogoutOpen}
        onCancel={closeLogout}
        onConfirm={logout}
        title="Выйти из SU LMS?"
      />
    </div>
  );
}
