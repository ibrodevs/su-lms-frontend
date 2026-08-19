import {
  BadgeCheck,
  Fingerprint,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RoleCode } from "../../api/auth.api";
import { useAuth } from "../../auth/useAuth";
import PageHeading from "../../components/student/PageHeading";
import StatePanel from "../../components/student/StatePanel";

interface ProfilePageProps {
  openLogout: () => void;
}

interface ProfileDetail {
  icon: LucideIcon;
  label: string;
  value: string;
}

const roleLabels: Record<RoleCode, string> = {
  student: "Студент",
  teacher: "Преподаватель",
  teaching_assistant: "Ассистент преподавателя",
  content_manager: "Контент-менеджер",
  lms_admin: "Администратор LMS",
  super_admin: "Суперадминистратор",
};

export default function ProfilePage({ openLogout }: ProfilePageProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <StatePanel
        description="Данные учётной записи пока недоступны. Обновите страницу или войдите повторно."
        icon={UserRound}
        kind="error"
        title="Не удалось загрузить профиль"
      />
    );
  }

  const fullName = user.full_name || `${user.first_name} ${user.last_name}`.trim();
  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}` || "SU";
  const details: ProfileDetail[] = [
    {
      icon: Mail,
      label: "Email",
      value: user.email ?? "Не указан",
    },
    {
      icon: Fingerprint,
      label: "Student ID",
      value: user.profile?.student_id ?? "Не указан",
    },
    {
      icon: UsersRound,
      label: "Группа",
      value: user.profile?.group ?? "Не указана",
    },
    {
      icon: ShieldCheck,
      label: "Роль",
      value: user.roles.map((role) => roleLabels[role]).join(", ") || "Не назначена",
    },
  ];

  return (
    <div className="grid gap-8">
      <PageHeading
        description="Личные данные и параметры учётной записи, полученные из SU LMS."
        eyebrow="Личный кабинет"
        title="Мой профиль"
      />

      <section className="flex flex-col justify-between gap-6 rounded-brand border-2 border-line bg-paper p-6 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-brand border-2 border-macaw bg-macaw/10 text-xl font-black text-macaw-dark">
            {initials}
          </span>
          <div className="min-w-0">
            <span className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-ecto-dark">
              <BadgeCheck aria-hidden="true" size={16} />
              {user.is_active ? "Активная учётная запись" : "Учётная запись отключена"}
            </span>
            <h2 className="truncate text-2xl font-black text-navy">{fullName}</h2>
            <p className="mt-1 text-sm font-bold text-ash">
              {user.profile?.group ?? "Группа не указана"}
            </p>
          </div>
        </div>
        <span className="rounded-brand border-2 border-line bg-mist px-4 py-3 text-sm font-black text-graphite">
          ID пользователя: {user.id}
        </span>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-brand border-2 border-line bg-paper p-6">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">
            Учётная запись
          </span>
          <h2 className="mt-2 text-xl font-black text-navy">Персональная информация</h2>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {details.map(({ icon: Icon, label, value }) => (
              <div className="rounded-brand border-2 border-line bg-mist/50 p-4" key={label}>
                <dt className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em] text-ash">
                  <Icon aria-hidden="true" size={17} />
                  {label}
                </dt>
                <dd className="mt-2 break-words text-sm font-black text-graphite">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <aside className="grid content-start gap-4">
          <section className="rounded-brand border-2 border-line bg-paper p-6">
            <span className="flex size-11 items-center justify-center rounded-brand border-2 border-eel bg-ecto/10 text-ecto-dark">
              <ShieldCheck aria-hidden="true" size={22} />
            </span>
            <h2 className="mt-4 text-xl font-black text-navy">Данные профиля</h2>
            <p className="mt-2 text-sm leading-6 text-ash">
              Информация синхронизируется с сервером. Для изменения данных обратитесь к администратору SU LMS.
            </p>
          </section>

          <section className="rounded-brand border-2 border-danger/25 bg-danger/5 p-6">
            <h2 className="text-xl font-black text-navy">Завершить сеанс</h2>
            <p className="mt-2 text-sm leading-6 text-ash">
              Выйдите из системы, если работаете на общем устройстве.
            </p>
            <button
              className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-brand border-2 border-danger bg-danger px-4 text-sm font-black text-white transition-colors hover:bg-danger/90"
              onClick={openLogout}
              type="button"
            >
              <LogOut aria-hidden="true" size={18} />
              Выйти
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
