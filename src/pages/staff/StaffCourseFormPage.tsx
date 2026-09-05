import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, ImagePlus, Save, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { courseKeys } from "../../api/courseKeys";
import { coursesApi } from "../../api/courses.api";
import type { CourseLanguage, CourseWritePayload } from "../../api/courses.api";
import { ApiClientError } from "../../api/errors";
import { organizationApi } from "../../api/organization.api";
import { queryClient } from "../../api/queryClient";
import { referenceKeys } from "../../api/referenceKeys";
import { referencesApi } from "../../api/references.api";
import { useAuth } from "../../auth/useAuth";
import StatePanel from "../../components/student/StatePanel";

interface RouteParams {
  courseId?: string;
}

interface CourseFormState {
  title: string;
  code: string;
  description: string;
  language: CourseLanguage;
  credits: string;
  facultyId: string;
  departmentId: string;
  programId: string;
  groupId: string;
  semesterId: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  cover: File | null;
  syllabus: File | null;
}

type FormFieldName = keyof CourseFormState;
type FormErrors = Partial<Record<FormFieldName, string>>;

const adminRoles = new Set(["lms_admin", "super_admin"]);
const emptyForm: CourseFormState = {
  title: "",
  code: "",
  description: "",
  language: "ru",
  credits: "4",
  facultyId: "",
  departmentId: "",
  programId: "",
  groupId: "",
  semesterId: "",
  teacherId: "",
  startDate: "",
  endDate: "",
  cover: null,
  syllabus: null,
};
const backendFieldMap: Record<string, FormFieldName> = {
  title: "title",
  code: "code",
  description: "description",
  language: "language",
  credits: "credits",
  faculty: "facultyId",
  department: "departmentId",
  program: "programId",
  group: "groupId",
  semester: "semesterId",
  teacher: "teacherId",
  start_date: "startDate",
  end_date: "endDate",
  cover: "cover",
  syllabus: "syllabus",
};

function apiFieldErrors(error: unknown): FormErrors {
  if (!(error instanceof ApiClientError) || !error.fields) return {};
  return Object.entries(error.fields).reduce<FormErrors>((result, [field, messages]) => {
    const formField = backendFieldMap[field];
    if (formField && messages[0]) result[formField] = messages[0];
    return result;
  }, {});
}

export default function StaffCourseFormPage() {
  const { courseId } = useParams<RouteParams>();
  const history = useHistory();
  const { can, user } = useAuth();
  const numericCourseId = Number(courseId);
  const isEditing = courseId !== undefined;
  const validCourseId = !isEditing || (Number.isInteger(numericCourseId) && numericCourseId > 0);
  const canWrite = can(isEditing ? "courses.edit" : "courses.create");
  const isTeacher = Boolean(user?.roles.includes("teacher"));
  const canSelectTeacher = Boolean(user?.roles.some((role) => adminRoles.has(role)));
  const [form, setForm] = useState<CourseFormState>(() => ({
    ...emptyForm,
    teacherId: isTeacher && user ? String(user.id) : "",
  }));
  const [clientErrors, setClientErrors] = useState<FormErrors>({});
  const destinationRef = useRef<"details" | "builder">("details");
  const hydratedCourseIdRef = useRef<number | null>(null);

  const courseQuery = useQuery({
    queryKey: courseKeys.detail(numericCourseId),
    queryFn: () => coursesApi.detail(numericCourseId),
    enabled: isEditing && validCourseId && canWrite,
  });
  const facultiesQuery = useQuery({
    queryKey: referenceKeys.faculties,
    queryFn: organizationApi.faculties,
    enabled: canWrite,
  });
  const semestersQuery = useQuery({
    queryKey: referenceKeys.semesters,
    queryFn: organizationApi.semesters,
    enabled: canWrite,
  });
  const facultyId = Number(form.facultyId) || undefined;
  const departmentId = Number(form.departmentId) || undefined;
  const programId = Number(form.programId) || undefined;
  const departmentsQuery = useQuery({
    queryKey: referenceKeys.departments(facultyId),
    queryFn: () => organizationApi.departments(facultyId),
    enabled: canWrite && facultyId !== undefined,
  });
  const programsQuery = useQuery({
    queryKey: referenceKeys.programs(departmentId),
    queryFn: () => organizationApi.programs(departmentId),
    enabled: canWrite && departmentId !== undefined,
  });
  const groupsQuery = useQuery({
    queryKey: referenceKeys.groups(programId),
    queryFn: () => organizationApi.groups(programId),
    enabled: canWrite && programId !== undefined,
  });
  const teachersQuery = useQuery({
    queryKey: referenceKeys.teachers,
    queryFn: referencesApi.teachers,
    enabled: canWrite && canSelectTeacher,
  });

  useEffect(() => {
    if (!isEditing || !courseQuery.data || hydratedCourseIdRef.current === courseQuery.data.id) return;
    const course = courseQuery.data;
    hydratedCourseIdRef.current = course.id;
    setForm({
      title: course.title,
      code: course.code,
      description: course.description,
      language: course.language,
      credits: String(course.credits),
      facultyId: String(course.faculty.id),
      departmentId: String(course.department.id),
      programId: String(course.program.id),
      groupId: course.group ? String(course.group.id) : "",
      semesterId: String(course.semester.id),
      teacherId: course.teacher ? String(course.teacher.id) : "",
      startDate: course.start_date,
      endDate: course.end_date,
      cover: null,
      syllabus: null,
    });
  }, [courseQuery.data, isEditing]);

  useEffect(() => {
    if (isEditing || form.semesterId || !semestersQuery.data?.length) return;
    const semester = semestersQuery.data[0];
    if (!semester) return;
    setForm((current) => ({
      ...current,
      semesterId: String(semester.id),
      startDate: semester.start_date,
      endDate: semester.end_date,
    }));
  }, [form.semesterId, isEditing, semestersQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: CourseWritePayload) => isEditing
      ? coursesApi.update(numericCourseId, payload)
      : coursesApi.create(payload),
    onSuccess: async (course) => {
      await queryClient.invalidateQueries({ queryKey: courseKeys.all });
      history.push(destinationRef.current === "builder" ? `/courses/${course.id}/builder` : `/courses/${course.id}`);
    },
  });
  const errors = useMemo(
    () => ({ ...apiFieldErrors(saveMutation.error), ...clientErrors }),
    [clientErrors, saveMutation.error],
  );

  const updateField = <Key extends keyof CourseFormState>(key: Key, value: CourseFormState[Key]) => {
    saveMutation.reset();
    setClientErrors((current) => ({ ...current, [key]: undefined }));
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "facultyId") {
        next.departmentId = "";
        next.programId = "";
        next.groupId = "";
      }
      if (key === "departmentId") next.programId = "";
      if (key === "departmentId") {
        next.programId = "";
        next.groupId = "";
      }
      if (key === "programId") {
        next.groupId = "";
      }
      if (key === "semesterId") {
        const semester = semestersQuery.data?.find((item) => String(item.id) === value);
        if (semester) {
          next.startDate = semester.start_date;
          next.endDate = semester.end_date;
        }
      }
      return next;
    });
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!form.title.trim()) nextErrors.title = "Введите название курса.";
    if (!form.code.trim()) nextErrors.code = "Введите code курса.";
    else if (!/^[A-ZА-ЯЁ0-9-]{3,50}$/i.test(form.code.trim())) nextErrors.code = "Используйте 3–50 букв, цифр или дефисов.";
    const credits = Number(form.credits);
    if (!Number.isInteger(credits) || credits < 1 || credits > 60) nextErrors.credits = "Укажите целое число от 1 до 60.";
    if (!form.facultyId) nextErrors.facultyId = "Выберите факультет.";
    if (!form.departmentId) nextErrors.departmentId = "Выберите кафедру.";
    if (!form.programId) nextErrors.programId = "Выберите программу.";
    if (!form.semesterId) nextErrors.semesterId = "Выберите семестр.";
    if (!form.startDate) nextErrors.startDate = "Укажите дату начала.";
    if (!form.endDate) nextErrors.endDate = "Укажите дату окончания.";
    else if (form.startDate && form.endDate < form.startDate) nextErrors.endDate = "Дата окончания должна быть не раньше даты начала.";
    setClientErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    destinationRef.current = submitter instanceof HTMLButtonElement && submitter.value === "builder" ? "builder" : "details";
    if (!validate()) return;
    saveMutation.mutate({
      title: form.title.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      language: form.language,
      credits: Number(form.credits),
      faculty: Number(form.facultyId),
      department: Number(form.departmentId),
      program: Number(form.programId),
      group: form.groupId ? Number(form.groupId) : (isEditing ? null : undefined),
      semester: Number(form.semesterId),
      teacher: form.teacherId ? Number(form.teacherId) : undefined,
      start_date: form.startDate,
      end_date: form.endDate,
      cover: form.cover ?? undefined,
      syllabus: form.syllabus ?? undefined,
    });
  };

  if (!validCourseId) return <StatePanel description="ID курса должен быть положительным числом." kind="error" title="Некорректный адрес курса" />;
  if (!canWrite) return <StatePanel action={<Link className="text-sm font-black text-macaw-dark hover:underline" to="/courses">Вернуться к курсам</Link>} description={`Backend не выдал permission ${isEditing ? "courses.edit" : "courses.create"}.`} kind="error" title="Нет доступа к форме" />;

  const referenceQueries = [facultiesQuery, semestersQuery, ...(canSelectTeacher ? [teachersQuery] : [])];
  if (referenceQueries.some((query) => query.isPending) || (isEditing && courseQuery.isPending)) {
    return <StatePanel description="Получаем курс и справочники с backend." kind="loading" title="Загрузка формы" />;
  }
  const failedQuery = referenceQueries.find((query) => query.isError) ?? (courseQuery.isError ? courseQuery : undefined);
  if (failedQuery?.error) {
    return <StatePanel action={<Link className="text-sm font-black text-macaw-dark hover:underline" to="/courses">Вернуться к курсам</Link>} description={failedQuery.error.message} kind="error" title="Форма недоступна" />;
  }

  const existingCourse = courseQuery.data;
  const teachers = teachersQuery.data ?? [];

  return (
    <div className="grid gap-6">
      <header>
        <Link className="inline-flex items-center gap-2 text-sm font-black text-ash hover:text-macaw-dark" to={existingCourse ? `/courses/${existingCourse.id}` : "/courses"}><ArrowLeft aria-hidden="true" size={17} /> Назад</Link>
        <span className="mt-5 block text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Course Management</span>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">{isEditing ? "Редактирование курса" : "Создание курса"}</h1>
        <p className="mt-2 text-sm text-ash">Все значения сохраняются напрямую в backend. Новый курс создаётся в статусе Draft.</p>
      </header>

      {saveMutation.error ? <p className="rounded-brand border-2 border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800" role="alert">{saveMutation.error.message}</p> : null}

      <form className="grid gap-6" noValidate onSubmit={submit}>
        <FormSection title="Основные данные">
          <FormField error={errors.title} label="Название курса" required><input className={inputClasses(errors.title)} maxLength={255} onChange={(event) => updateField("title", event.target.value)} value={form.title} /></FormField>
          <FormField error={errors.code} label="Code" required><input className={inputClasses(errors.code)} maxLength={50} onChange={(event) => updateField("code", event.target.value.toUpperCase())} placeholder="CS101" value={form.code} /></FormField>
          <FormField className="md:col-span-2" error={errors.description} label="Описание"><textarea className={`${inputClasses(errors.description)} min-h-32 py-3`} onChange={(event) => updateField("description", event.target.value)} value={form.description} /></FormField>
          <FormField label="Язык" required><select className={inputClasses()} onChange={(event) => updateField("language", event.target.value as CourseLanguage)} value={form.language}><option value="ru">Русский</option><option value="ky">Кыргызский</option><option value="en">English</option></select></FormField>
          <FormField error={errors.credits} label="Кредиты" required><input className={inputClasses(errors.credits)} max="60" min="1" onChange={(event) => updateField("credits", event.target.value)} type="number" value={form.credits} /></FormField>
        </FormSection>

        <FormSection title="Организация и период">
          <FormField error={errors.facultyId} label="Факультет" required><select className={inputClasses(errors.facultyId)} onChange={(event) => updateField("facultyId", event.target.value)} value={form.facultyId}><option value="">Выберите факультет</option>{facultiesQuery.data?.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}</select></FormField>
          <FormField error={errors.departmentId} label="Кафедра" required><select className={inputClasses(errors.departmentId)} disabled={!form.facultyId || departmentsQuery.isPending} onChange={(event) => updateField("departmentId", event.target.value)} value={form.departmentId}><option value="">{departmentsQuery.isPending ? "Загрузка…" : "Выберите кафедру"}</option>{departmentsQuery.data?.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}</select></FormField>
          <FormField error={errors.programId} label="Программа" required><select className={inputClasses(errors.programId)} disabled={!form.departmentId || programsQuery.isPending} onChange={(event) => updateField("programId", event.target.value)} value={form.programId}><option value="">{programsQuery.isPending ? "Загрузка…" : "Выберите программу"}</option>{programsQuery.data?.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}</select></FormField>
          <FormField error={errors.groupId} label="Академическая группа"><select className={inputClasses(errors.groupId)} disabled={!form.programId || groupsQuery.isPending} onChange={(event) => updateField("groupId", event.target.value)} value={form.groupId}><option value="">{groupsQuery.isPending ? "Загрузка…" : "Все группы / Без группы"}</option>{groupsQuery.data?.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.admission_year})</option>)}</select></FormField>
          <FormField error={errors.semesterId} label="Семестр" required><select className={inputClasses(errors.semesterId)} onChange={(event) => updateField("semesterId", event.target.value)} value={form.semesterId}><option value="">Выберите семестр</option>{semestersQuery.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField>
          {canSelectTeacher ? <FormField error={errors.teacherId} label="Преподаватель"><select className={inputClasses(errors.teacherId)} onChange={(event) => updateField("teacherId", event.target.value)} value={form.teacherId}><option value="">Назначить позже</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}</select></FormField> : <FormField label="Преподаватель"><input className={inputClasses()} disabled value={isTeacher ? user?.full_name ?? "Текущий преподаватель" : existingCourse?.teacher?.full_name ?? "Назначается LMS Admin"} /></FormField>}
          <FormField error={errors.startDate} label="Дата начала" required><input className={inputClasses(errors.startDate)} onChange={(event) => updateField("startDate", event.target.value)} type="date" value={form.startDate} /></FormField>
          <FormField error={errors.endDate} label="Дата окончания" required><input className={inputClasses(errors.endDate)} onChange={(event) => updateField("endDate", event.target.value)} type="date" value={form.endDate} /></FormField>
        </FormSection>

        <FormSection title="Файлы курса">
          <FileField accept="image/jpeg,image/png,image/webp" error={errors.cover} icon={ImagePlus} label="Обложка" name={form.cover?.name ?? (existingCourse?.cover ? "Текущая обложка сохранена" : "Файл не выбран")} onChange={(file) => updateField("cover", file)} />
          <FileField accept=".pdf,.doc,.docx" error={errors.syllabus} icon={FileText} label="Syllabus" name={form.syllabus?.name ?? (existingCourse?.syllabus ? "Текущий syllabus сохранён" : "Файл не выбран")} onChange={(file) => updateField("syllabus", file)} />
        </FormSection>

        <div className="sticky bottom-3 z-20 flex flex-col-reverse gap-3 rounded-brand border-2 border-line bg-paper/95 p-3 backdrop-blur sm:flex-row sm:justify-end">
          <Link className="inline-flex min-h-12 items-center justify-center rounded-brand border-2 border-line px-5 text-sm font-black text-graphite hover:bg-mist" to={existingCourse ? `/courses/${existingCourse.id}` : "/courses"}>Отмена</Link>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto px-5 text-sm font-black text-ecto-dark hover:bg-ecto/10 disabled:opacity-50" disabled={saveMutation.isPending} name="destination" type="submit" value="details"><Save aria-hidden="true" size={18} />{saveMutation.isPending ? "Сохраняем…" : isEditing ? "Сохранить изменения" : "Сохранить черновик"}</button>
          <button className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white disabled:opacity-50" disabled={saveMutation.isPending} name="destination" type="submit" value="builder"><Save aria-hidden="true" size={18} /> Сохранить и продолжить</button>
        </div>
      </form>
    </div>
  );
}

function inputClasses(error?: string): string {
  return `min-h-12 w-full rounded-brand border-2 bg-paper px-3 text-sm font-bold text-graphite outline-none disabled:bg-mist disabled:text-ash ${error ? "border-danger" : "border-line focus:border-macaw"}`;
}

function FormSection({ children, title }: { children: ReactNode; title: string }) {
  return <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7"><h2 className="text-xl font-black text-navy">{title}</h2><div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{children}</div></section>;
}

interface FormFieldProps {
  children: ReactNode;
  className?: string;
  error?: string;
  label: string;
  required?: boolean;
}

function FormField({ children, className = "", error, label, required }: FormFieldProps) {
  return <label className={`grid content-start gap-2 ${className}`}><span className="text-xs font-black uppercase tracking-wider text-ash">{label}{required ? <span className="ml-1 text-danger">*</span> : null}</span>{children}{error ? <span className="text-xs font-bold text-danger">{error}</span> : null}</label>;
}

interface FileFieldProps {
  accept: string;
  error?: string;
  icon: typeof FileText;
  label: string;
  name: string;
  onChange: (file: File | null) => void;
}

function FileField({ accept, error, icon: Icon, label, name, onChange }: FileFieldProps) {
  return <div className="rounded-brand border-2 border-dashed border-line p-4"><div className="flex items-center gap-3"><Icon aria-hidden="true" className="text-macaw-dark" size={22} /><div><strong className="text-sm font-black text-graphite">{label}</strong><span className="mt-1 block max-w-xs truncate text-xs text-ash">{name}</span></div></div><label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-brand border-2 border-line px-4 py-2 text-xs font-black text-graphite hover:border-lingot"><Upload aria-hidden="true" size={16} /> Выбрать файл<input accept={accept} className="sr-only" onChange={(event) => onChange(event.target.files?.[0] ?? null)} type="file" /></label>{error ? <p className="mt-2 text-xs font-bold text-danger">{error}</p> : null}</div>;
}
