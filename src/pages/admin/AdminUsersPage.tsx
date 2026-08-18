import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Plus, Search, ShieldCheck, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { RoleCode } from "../../api/auth.api";
import { ApiClientError } from "../../api/errors";
import { referenceKeys } from "../../api/referenceKeys";
import { rolesApi } from "../../api/roles.api";
import { usersApi } from "../../api/users.api";
import type { CreateUserPayload, UserDto, UserListParams } from "../../api/users.api";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import PasswordInput from "../../components/common/PasswordInput";
import StatePanel from "../../components/student/StatePanel";

const PAGE_SIZE = 20;
const EMPTY_CREATE_FORM: CreateUserPayload = {
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  roles: [],
};

function getInitials(user: UserDto): string {
  return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}` || "SU";
}

function getFieldError(error: unknown, field: keyof CreateUserPayload): string | undefined {
  return error instanceof ApiClientError ? error.fields?.[field]?.[0] : undefined;
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleCode | "">("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserPayload>(EMPTY_CREATE_FORM);

  const listParams = useMemo<UserListParams>(
    () => ({ page, pageSize: PAGE_SIZE, search: search || undefined, role: role || undefined }),
    [page, role, search],
  );
  const usersQuery = useQuery({
    queryKey: referenceKeys.users(listParams),
    queryFn: () => usersApi.list(listParams),
    placeholderData: keepPreviousData,
  });
  const rolesQuery = useQuery({
    queryKey: referenceKeys.roles,
    queryFn: rolesApi.list,
  });
  const detailQuery = useQuery({
    queryKey: referenceKeys.user(selectedUserId ?? 0),
    queryFn: () => usersApi.detail(selectedUserId as number),
    enabled: selectedUserId !== null,
  });
  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: async (createdUser) => {
      await queryClient.invalidateQueries({ queryKey: referenceKeys.usersAll });
      setCreateForm(EMPTY_CREATE_FORM);
      setIsCreateOpen(false);
      setSelectedUserId(createdUser.id);
    },
  });

  const roleNames = useMemo(
    () => new Map((rolesQuery.data ?? []).map((item) => [item.code, item.name])),
    [rolesQuery.data],
  );
  const totalPages = Math.max(1, Math.ceil((usersQuery.data?.count ?? 0) / PAGE_SIZE));

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  };

  const openCreate = () => {
    createMutation.reset();
    setCreateForm(EMPTY_CREATE_FORM);
    setIsCreateOpen(true);
  };

  const closeCreate = () => {
    if (createMutation.isPending) return;
    setIsCreateOpen(false);
  };

  const updateCreateField = (field: keyof CreateUserPayload, value: string) => {
    setCreateForm((current) => ({ ...current, [field]: value }));
    createMutation.reset();
  };

  const toggleRole = (roleCode: RoleCode) => {
    setCreateForm((current) => ({
      ...current,
      roles: current.roles.includes(roleCode)
        ? current.roles.filter((item) => item !== roleCode)
        : [...current.roles, roleCode],
    }));
    createMutation.reset();
  };

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate({
      ...createForm,
      email: createForm.email.trim(),
      first_name: createForm.first_name.trim(),
      last_name: createForm.last_name.trim(),
    });
  };

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 rounded-brand border-2 border-line bg-paper p-5 sm:flex-row sm:items-end sm:justify-between lg:p-7">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Admin Console</span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">Пользователи</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ash">
            Реальные учётные записи и роли SU LMS. Редактирование не показывается, поскольку backend Release 1 предоставляет только List, Create и Detail.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus aria-hidden="true" size={18} />
          Создать пользователя
        </Button>
      </header>

      <section className="rounded-brand border-2 border-line bg-paper p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_16rem]">
          <form className="flex gap-2" onSubmit={submitSearch}>
            <label className="relative flex-1" htmlFor="user-search">
              <span className="sr-only">Поиск пользователей</span>
              <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" size={18} />
              <input
                className="h-12 w-full rounded-brand border-2 border-line bg-paper pl-10 pr-3 text-sm font-bold text-graphite outline-none focus:border-macaw"
                id="user-search"
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Email, имя или фамилия"
                value={searchDraft}
              />
            </label>
            <Button type="submit" variant="secondary">Найти</Button>
          </form>
          <label className="grid gap-1 text-xs font-black text-ash" htmlFor="user-role-filter">
            Роль
            <select
              className="h-12 rounded-brand border-2 border-line bg-paper px-3 text-sm font-bold text-graphite outline-none focus:border-macaw"
              id="user-role-filter"
              onChange={(event) => {
                setRole(event.target.value as RoleCode | "");
                setPage(1);
              }}
              value={role}
            >
              <option value="">Все роли</option>
              {(rolesQuery.data ?? []).map((item) => (
                <option key={item.code} value={item.code}>{item.name}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {usersQuery.isPending ? (
        <StatePanel description="Получаем пользователей backend." kind="loading" title="Загрузка пользователей" />
      ) : usersQuery.isError ? (
        <StatePanel
          action={<Button onClick={() => usersQuery.refetch()} variant="secondary">Повторить</Button>}
          description={usersQuery.error instanceof Error ? usersQuery.error.message : "Не удалось загрузить пользователей."}
          kind="error"
          title="Ошибка загрузки"
        />
      ) : usersQuery.data.results.length === 0 ? (
        <StatePanel description="Измените поисковый запрос или фильтр роли." title="Пользователи не найдены" />
      ) : (
        <section className="overflow-hidden rounded-brand border-2 border-line bg-paper">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-mist text-[11px] font-black uppercase tracking-wider text-ash">
                <tr>
                  <th className="px-5 py-4">Пользователь</th>
                  <th className="px-5 py-4">Роли</th>
                  <th className="px-5 py-4">Статус</th>
                  <th className="px-5 py-4 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-line">
                {usersQuery.data.results.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-brand bg-navy text-xs font-black text-white">{getInitials(item)}</span>
                        <div className="min-w-0">
                          <strong className="block truncate text-sm font-black text-graphite">{item.full_name || "Имя не указано"}</strong>
                          <span className="mt-1 block truncate text-xs text-ash">{item.email ?? "Email не указан"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {item.roles.map((roleCode) => (
                          <span className="rounded-brand border border-eel bg-eel/20 px-2 py-1 text-[10px] font-black text-ecto-dark" key={roleCode}>
                            {roleNames.get(roleCode) ?? roleCode}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={item.is_active ? "font-black text-ecto-dark" : "font-black text-danger"}>
                        {item.is_active ? "Активен" : "Отключён"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        className="inline-flex min-h-10 items-center gap-2 rounded-brand border-2 border-line px-3 text-xs font-black text-graphite hover:border-lingot hover:bg-eel/10"
                        onClick={() => setSelectedUserId(item.id)}
                        type="button"
                      >
                        <Eye aria-hidden="true" size={16} />
                        Открыть
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="flex flex-col gap-3 border-t-2 border-line px-5 py-4 text-xs font-bold text-ash sm:flex-row sm:items-center sm:justify-between">
            <span>Всего: {usersQuery.data.count}</span>
            <div className="flex items-center gap-2">
              <Button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} variant="secondary">Назад</Button>
              <span className="px-2">{page} / {totalPages}</span>
              <Button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} variant="secondary">Далее</Button>
            </div>
          </footer>
        </section>
      )}

      <Modal
        description="Backend создаст реальную учётную запись и назначит выбранные роли."
        isOpen={isCreateOpen}
        onClose={closeCreate}
        title="Новый пользователь"
      >
        <form className="su-form" onSubmit={submitCreate}>
          {createMutation.isError ? (
            <Alert onClose={undefined} title="Не удалось создать пользователя" variant="error">
              {createMutation.error instanceof Error ? createMutation.error.message : "Проверьте заполненные данные."}
            </Alert>
          ) : null}
          <div className="su-form-grid">
            <Input
              error={getFieldError(createMutation.error, "first_name")}
              hint={undefined}
              id="create-user-first-name"
              icon={undefined}
              label="Имя"
              onChange={(event: ChangeEvent<HTMLInputElement>) => updateCreateField("first_name", event.target.value)}
              required
              value={createForm.first_name}
            />
            <Input
              error={getFieldError(createMutation.error, "last_name")}
              hint={undefined}
              id="create-user-last-name"
              icon={undefined}
              label="Фамилия"
              onChange={(event: ChangeEvent<HTMLInputElement>) => updateCreateField("last_name", event.target.value)}
              required
              value={createForm.last_name}
            />
          </div>
          <Input
            autoComplete="email"
            error={getFieldError(createMutation.error, "email")}
            hint={undefined}
            id="create-user-email"
            icon={undefined}
            label="Email"
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateCreateField("email", event.target.value)}
            required
            type="email"
            value={createForm.email}
          />
          <PasswordInput
            autoComplete="new-password"
            error={getFieldError(createMutation.error, "password")}
            id="create-user-password"
            label="Временный пароль"
            minLength={8}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateCreateField("password", event.target.value)}
            required
            value={createForm.password}
          />
          <fieldset className="grid gap-3 rounded-brand border-2 border-line p-4">
            <legend className="px-2 text-sm font-black text-graphite">Роли *</legend>
            {(rolesQuery.data ?? []).map((item) => (
              <label className="flex items-start gap-3 text-sm font-bold text-graphite" key={item.code}>
                <input
                  checked={createForm.roles.includes(item.code)}
                  className="mt-0.5 size-4 accent-ecto-dark"
                  onChange={() => toggleRole(item.code)}
                  type="checkbox"
                />
                <span><strong className="block">{item.name}</strong>{item.description ? <small className="text-ash">{item.description}</small> : null}</span>
              </label>
            ))}
            {getFieldError(createMutation.error, "roles") ? <p className="text-xs font-bold text-danger">{getFieldError(createMutation.error, "roles")}</p> : null}
          </fieldset>
          <div className="su-modal__actions">
            <Button disabled={createMutation.isPending} onClick={closeCreate} variant="secondary">Отмена</Button>
            <Button disabled={createForm.roles.length === 0} isLoading={createMutation.isPending} type="submit">
              <Plus aria-hidden="true" size={17} />
              Создать
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        description="Данные загружены через read-only User Detail endpoint."
        isOpen={selectedUserId !== null}
        onClose={() => setSelectedUserId(null)}
        title="Профиль пользователя"
      >
        {detailQuery.isPending ? (
          <StatePanel description="Получаем профиль backend." kind="loading" title="Загрузка" />
        ) : detailQuery.isError ? (
          <StatePanel description={detailQuery.error.message} kind="error" title="Не удалось загрузить профиль" />
        ) : detailQuery.data ? (
          <div className="grid gap-5">
            <div className="flex items-center gap-4 rounded-brand border-2 border-line p-4">
              <span className="grid size-14 place-items-center rounded-brand bg-navy text-sm font-black text-white">{getInitials(detailQuery.data)}</span>
              <div className="min-w-0">
                <h3 className="truncate text-xl font-black text-navy">{detailQuery.data.full_name || "Имя не указано"}</h3>
                <p className="mt-1 truncate text-sm text-ash">{detailQuery.data.email ?? "Email не указан"}</p>
              </div>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-brand bg-mist p-4"><dt className="text-xs font-black uppercase text-ash">ID</dt><dd className="mt-1 font-black text-graphite">{detailQuery.data.id}</dd></div>
              <div className="rounded-brand bg-mist p-4"><dt className="text-xs font-black uppercase text-ash">Статус</dt><dd className="mt-1 font-black text-graphite">{detailQuery.data.is_active ? "Активен" : "Отключён"}</dd></div>
            </dl>
            <section className="rounded-brand border-2 border-line p-4">
              <div className="flex items-center gap-2 text-sm font-black text-navy"><ShieldCheck aria-hidden="true" size={18} /> Назначенные роли</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {detailQuery.data.roles.map((roleCode) => <span className="rounded-brand bg-eel/20 px-3 py-2 text-xs font-black text-ecto-dark" key={roleCode}>{roleNames.get(roleCode) ?? roleCode}</span>)}
              </div>
            </section>
          </div>
        ) : (
          <StatePanel description="Профиль отсутствует." icon={UserRound} title="Нет данных" />
        )}
      </Modal>
    </div>
  );
}
