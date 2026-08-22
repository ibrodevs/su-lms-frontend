import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Search, UserPlus, Users, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { enrollmentKeys } from "../../api/enrollmentKeys";
import { enrollmentsApi } from "../../api/enrollments.api";
import type { EnrollmentListParams, EnrollmentSource, EnrollmentStatus } from "../../api/enrollments.api";
import { queryClient } from "../../api/queryClient";
import { referenceKeys } from "../../api/referenceKeys";
import { usersApi } from "../../api/users.api";
import type { UserDto, UserListParams } from "../../api/users.api";
import { useAuth } from "../../auth/useAuth";
import StatePanel from "../student/StatePanel";

interface CourseEnrollmentsPanelProps { courseId: number; }

const PAGE_SIZE = 50;
const activeStudentParams: UserListParams = { pageSize: 100, role: "student", isActive: true };
const statusLabels: Record<EnrollmentStatus, string> = { active: "Активен", completed: "Завершил", withdrawn: "Отчислен", suspended: "Приостановлен" };
const sourceLabels: Record<EnrollmentSource, string> = { manual: "Вручную", sis_sync: "SIS sync" };
const statusClasses: Record<EnrollmentStatus, string> = {
  active: "border-ecto/40 bg-ecto/10 text-ecto-dark",
  completed: "border-macaw/40 bg-macaw/10 text-macaw-dark",
  withdrawn: "border-red-300 bg-red-50 text-red-700",
  suspended: "border-warning/50 bg-warning/10 text-warning-dark",
};
const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function CourseEnrollmentsPanel({ courseId }: CourseEnrollmentsPanelProps) {
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const deferredSearch = useDeferredValue(studentSearch.trim());
  const canManage = can("enrollments.manage");
  const listParams = useMemo<EnrollmentListParams>(() => ({ page, pageSize: PAGE_SIZE }), [page]);
  const searchParams = useMemo<UserListParams>(() => ({ ...activeStudentParams, search: deferredSearch || undefined }), [deferredSearch]);
  const enrollmentsQuery = useQuery({ queryKey: enrollmentKeys.list(courseId, listParams), queryFn: () => enrollmentsApi.list(courseId, listParams), enabled: can("enrollments.view") });
  const studentDirectoryQuery = useQuery({ queryKey: referenceKeys.users(activeStudentParams), queryFn: () => usersApi.list(activeStudentParams), enabled: canManage });
  const studentSearchQuery = useQuery({ queryKey: referenceKeys.users(searchParams), queryFn: () => usersApi.list(searchParams), enabled: canManage && isAddOpen && Boolean(deferredSearch) });
  const selectableStudents = deferredSearch ? studentSearchQuery.data?.results ?? [] : studentDirectoryQuery.data?.results ?? [];
  const createMutation = useMutation({
    mutationFn: (studentId: number) => enrollmentsApi.create(courseId, { student: studentId, source: "manual" }),
    onSuccess: async () => {
      setSuccessMessage("Студент добавлен или повторно активирован backend.");
      closeDialog();
      await queryClient.invalidateQueries({ queryKey: enrollmentKeys.course(courseId) });
    },
  });

  const closeDialog = () => {
    createMutation.reset();
    setIsAddOpen(false);
    setStudentSearch("");
    setSelectedStudentId(null);
  };

  if (!can("enrollments.view")) return <StatePanel description="Backend не выдал permission enrollments.view." kind="error" title="Зачисления недоступны" />;
  if (enrollmentsQuery.isPending) return <StatePanel description="Получаем зачисления курса с backend." kind="loading" title="Загрузка студентов" />;
  if (enrollmentsQuery.isError) return <StatePanel description={enrollmentsQuery.error.message} kind="error" title="Не удалось загрузить зачисления" />;

  const enrollments = enrollmentsQuery.data;
  const totalPages = Math.max(1, Math.ceil(enrollments.count / PAGE_SIZE));
  return (
    <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-ecto-dark">Enrollments</span><h2 className="mt-1 text-xl font-black text-navy">Студенты курса</h2><p className="mt-1 text-sm text-ash">Всего записей: {enrollments.count}</p></div>{canManage ? <button className="student-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white" onClick={() => { setSuccessMessage(""); setIsAddOpen(true); }} type="button"><Plus aria-hidden="true" size={17} /> Добавить студента</button> : <span className="rounded-brand border-2 border-line bg-mist px-3 py-2 text-xs font-black text-ash">Только просмотр</span>}</div>
      {successMessage ? <p className="mt-4 rounded-brand border-2 border-ecto/40 bg-ecto/10 p-3 text-sm font-bold text-ecto-dark" role="status">{successMessage}</p> : null}
      {studentDirectoryQuery.isError && canManage ? <p className="mt-4 rounded-brand border-2 border-warning/50 bg-warning/10 p-3 text-sm font-bold text-warning-dark" role="alert">Список зачислений доступен, но User API не загрузился: {studentDirectoryQuery.error.message}</p> : null}

      {enrollments.results.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[820px] border-separate border-spacing-0 text-left"><thead><tr className="text-[10px] font-black uppercase tracking-wider text-ash"><th className="border-b-2 border-line px-3 py-3">Студент</th><th className="border-b-2 border-line px-3 py-3">Student ID</th><th className="border-b-2 border-line px-3 py-3">Статус</th><th className="border-b-2 border-line px-3 py-3">Источник</th><th className="border-b-2 border-line px-3 py-3">Зачислен</th></tr></thead><tbody>{enrollments.results.map((enrollment) => <tr key={enrollment.id}><td className="border-b border-line px-3 py-4"><strong className="block text-sm font-black text-graphite">{enrollment.student.full_name || `Студент #${enrollment.student.id}`}</strong><span className="mt-1 block text-xs text-ash">{enrollment.student.email ?? `User ID: ${enrollment.student.id}`}</span></td><td className="border-b border-line px-3 py-4 text-sm font-bold text-ash">{enrollment.student.student_id ?? "—"}</td><td className="border-b border-line px-3 py-4"><span className={`inline-flex rounded-brand border-2 px-2.5 py-1 text-xs font-black ${statusClasses[enrollment.status]}`}>{statusLabels[enrollment.status]}</span></td><td className="border-b border-line px-3 py-4 text-sm font-bold text-graphite">{sourceLabels[enrollment.source]}</td><td className="border-b border-line px-3 py-4 text-xs font-bold text-ash">{dateFormatter.format(new Date(enrollment.enrolled_at))}</td></tr>)}</tbody></table></div> : <div className="mt-5 grid min-h-56 place-items-center rounded-brand border-2 border-dashed border-line bg-mist p-6 text-center"><div><Users aria-hidden="true" className="mx-auto text-ash" size={36} /><h3 className="mt-3 text-lg font-black text-navy">Студентов пока нет</h3><p className="mt-2 text-sm text-ash">Добавьте студента вручную или дождитесь синхронизации SIS на стороне backend.</p></div></div>}

      {totalPages > 1 ? <nav aria-label="Пагинация зачислений" className="mt-5 flex items-center justify-between gap-3"><button aria-label="Предыдущая страница" className="grid size-10 place-items-center rounded-brand border-2 border-line text-ash disabled:opacity-40" disabled={!enrollments.previous} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button"><ChevronLeft aria-hidden="true" size={18} /></button><span className="text-xs font-black text-ash">Страница {page} из {totalPages}</span><button aria-label="Следующая страница" className="grid size-10 place-items-center rounded-brand border-2 border-line text-ash disabled:opacity-40" disabled={!enrollments.next} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} type="button"><ChevronRight aria-hidden="true" size={18} /></button></nav> : null}
      {isAddOpen ? <AddStudentDialog error={createMutation.error?.message} isLoading={deferredSearch ? studentSearchQuery.isPending : studentDirectoryQuery.isPending} isPending={createMutation.isPending} onClose={closeDialog} onSearch={(value) => { setStudentSearch(value); setSelectedStudentId(null); }} onSelect={setSelectedStudentId} onSubmit={() => selectedStudentId && createMutation.mutate(selectedStudentId)} search={studentSearch} selectedStudentId={selectedStudentId} students={selectableStudents} /> : null}
    </section>
  );
}

interface AddStudentDialogProps { error?: string; isLoading: boolean; isPending: boolean; onClose: () => void; onSearch: (value: string) => void; onSelect: (studentId: number) => void; onSubmit: () => void; search: string; selectedStudentId: number | null; students: UserDto[]; }

function AddStudentDialog({ error, isLoading, isPending, onClose, onSearch, onSelect, onSubmit, search, selectedStudentId, students }: AddStudentDialogProps) {
  return <div aria-labelledby="add-enrollment-title" aria-modal="true" className="fixed inset-0 z-[115] grid place-items-center bg-midnight/75 p-4" role="dialog"><div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-brand border-2 border-line bg-paper"><header className="flex items-start justify-between gap-4 border-b-2 border-line p-5"><div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-ecto-dark">Manual Enrollment</span><h2 className="mt-1 text-xl font-black text-navy" id="add-enrollment-title">Добавить студента</h2><p className="mt-1 text-sm text-ash">Список загружается через User API с ролью Student.</p></div><button aria-label="Закрыть" className="grid size-10 shrink-0 place-items-center rounded-brand border-2 border-line text-ash hover:bg-mist" disabled={isPending} onClick={onClose} type="button"><X aria-hidden="true" size={18} /></button></header><div className="min-h-0 flex-1 overflow-y-auto p-5"><label className="relative block"><span className="sr-only">Поиск студентов</span><Search aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-ash" size={18} /><input autoFocus className="min-h-12 w-full rounded-brand border-2 border-line bg-paper pl-11 pr-4 text-sm font-bold text-graphite outline-none focus:border-macaw" onChange={(event) => onSearch(event.target.value)} placeholder="Имя или email студента" value={search} /></label>{isLoading ? <div className="mt-4"><StatePanel description="Ищем активных студентов." kind="loading" title="Загрузка студентов" /></div> : students.length ? <fieldset className="mt-4 grid gap-2"><legend className="sr-only">Выберите студента</legend>{students.map((student) => <label className={`flex cursor-pointer items-center gap-3 rounded-brand border-2 p-3 ${selectedStudentId === student.id ? "border-ecto bg-ecto/10" : "border-line hover:border-lingot"}`} key={student.id}><input checked={selectedStudentId === student.id} className="size-5 accent-[#27a8e0]" name="student" onChange={() => onSelect(student.id)} type="radio" /><span className="min-w-0"><strong className="block truncate text-sm font-black text-graphite">{student.full_name || `Студент #${student.id}`}</strong><span className="mt-1 block truncate text-xs text-ash">{student.email ?? "Email не указан"} · User ID {student.id}</span></span></label>)}</fieldset> : <div className="mt-4 rounded-brand border-2 border-dashed border-line bg-mist p-6 text-center"><Users aria-hidden="true" className="mx-auto text-ash" size={30} /><p className="mt-2 text-sm font-bold text-ash">Активные студенты не найдены.</p></div>}{error ? <p className="mt-4 rounded-brand border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{error}</p> : null}</div><footer className="flex gap-3 border-t-2 border-line p-4 sm:justify-end"><button className="min-h-11 flex-1 rounded-brand border-2 border-line px-5 text-sm font-black text-graphite sm:flex-none" disabled={isPending} onClick={onClose} type="button">Отмена</button><button className="student-pressable inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white disabled:opacity-50 sm:flex-none" disabled={!selectedStudentId || isPending} onClick={onSubmit} type="button"><UserPlus aria-hidden="true" size={17} />{isPending ? "Добавление…" : "Добавить"}</button></footer></div></div>;
}
