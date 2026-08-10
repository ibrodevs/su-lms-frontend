import { Bell, CheckCheck, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeading from "../../components/student/PageHeading";
import StatePanel from "../../components/student/StatePanel";
import { mockNotifications } from "../../data/student/mockNotifications";
import { useMockLoading } from "../../hooks/useMockLoading";
import { getStudentLocalState, markAllNotificationsRead, markNotificationRead } from "../../services/studentStorage";

const notificationDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Almaty",
});

export default function StudentNotificationsPage() {
  const isLoading = useMockLoading();
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const state = useMemo(getStudentLocalState, [version]);
  const unread = mockNotifications.filter((item) => !state.readNotifications.includes(item.id) && !item.read).length;
  const notifications = useMemo(() => mockNotifications.filter((item) => { const isRead = item.read || state.readNotifications.includes(item.id); return !deletedIds.includes(item.id) && `${item.title} ${item.text}`.toLowerCase().includes(query.toLowerCase()) && (filter === "all" || !isRead); }), [deletedIds, filter, query, state.readNotifications, version]);
  const markRead = (id: string) => { markNotificationRead(id); setVersion((value) => value + 1); };
  if (isLoading) return <StatePanel kind="loading" title="Загружаем уведомления" description="Проверяем новые сообщения и дедлайны." />;
  return <div className="grid gap-6"><PageHeading eyebrow="Центр сообщений" title="Уведомления" description={`${unread} непрочитанных уведомления`} actions={<button className="student-pressable inline-flex items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 py-3 text-sm font-black text-white" onClick={() => { markAllNotificationsRead(mockNotifications.map((item) => item.id)); setVersion((value) => value + 1); }} type="button"><CheckCheck size={16} /> Прочитать все</button>} /><section className="grid gap-3 rounded-brand border-2 border-line bg-paper p-4 sm:grid-cols-[1fr_auto]"><label className="relative m-0 block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ash" size={18} /><input aria-label="Поиск уведомлений" className="w-full rounded-brand border-2 border-line py-3 pl-10 pr-3 text-sm outline-none focus:border-macaw" onChange={(event) => setQuery(event.target.value)} placeholder="Поиск" value={query} /></label><select aria-label="Фильтр уведомлений" className="rounded-brand border-2 border-line px-3 py-3 text-sm font-bold" onChange={(event) => setFilter(event.target.value as "all" | "unread")} value={filter}><option value="all">Все</option><option value="unread">Непрочитанные</option></select></section>{notifications.length === 0 ? <StatePanel title="Уведомлений нет" description="Все сообщения прочитаны или не соответствуют фильтру." icon={Bell} /> : <section className="grid gap-3">{notifications.map((item) => { const isRead = item.read || state.readNotifications.includes(item.id); return <article className={`grid gap-3 rounded-brand border-2 p-4 md:grid-cols-[auto_1fr_auto] md:items-center ${isRead ? "border-line bg-paper" : "border-eel bg-ecto/10"}`} key={item.id}><span className="grid size-11 place-items-center rounded-brand border-2 border-macaw/30 bg-macaw/10 text-macaw-dark"><Bell size={18} /></span><div><h2 className="text-base font-black text-navy">{item.title}</h2><p className="mt-1 text-sm leading-6 text-ash">{item.text}</p><time className="mt-2 block text-xs font-bold text-ash">{notificationDateFormatter.format(new Date(item.createdAt))}</time></div><div className="flex flex-wrap gap-2"><button aria-label="Удалить уведомление" className="grid size-10 place-items-center rounded-brand border-2 border-line text-ash hover:text-danger" onClick={() => { setDeletedIds((ids) => [...ids, item.id]); setVersion((value) => value + 1); }} type="button"><Trash2 size={16} /></button>{item.target && <Link className="rounded-brand border-2 border-line px-3 py-2 text-xs font-black text-macaw-dark" onClick={() => markRead(item.id)} to={item.target}>Открыть</Link>}{!isRead && <button className="rounded-brand border-2 border-ecto-dark bg-ecto px-3 py-2 text-xs font-black text-white" onClick={() => markRead(item.id)} type="button">Прочитано</button>}</div></article>; })}</section>}</div>;
}
