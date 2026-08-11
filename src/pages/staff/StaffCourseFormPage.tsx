import { ArrowLeft, BookCopy, FileText, ImagePlus, Save, Upload, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useHistory, useLocation, useParams } from "react-router-dom";
import StaffToast from "../../components/staff/StaffToast";
import type { ToastMessage } from "../../components/staff/StaffToast";
import PublishedCourseNotice from "../../components/staff/PublishedCourseNotice";
import ConfirmDialog from "../../components/student/ConfirmDialog";
import {
  mockDepartments,
  mockFaculties,
  mockPrograms,
  mockSemesters,
} from "../../data/mock/mockOrganization";
import { mockTeachers } from "../../data/mock/mockUsers";
import {
  createCourse,
  getCourse,
  isCourseCodeUnique,
  updateCourse,
} from "../../services/courseService";
import {
  createCourseFromTemplate,
  getCourseTemplate,
  getCourseTemplateStats,
} from "../../services/courseTemplateService";
import { getStaffSession } from "../../services/staffSession";
import type { CourseInput, CourseLanguage } from "../../types/staff";

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
  semesterId: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  coverDataUrl: string;
  coverName: string;
  syllabusName: string;
}

type FormErrors = Partial<Record<keyof CourseFormState, string>>;

function getInitialForm(teacherId: string): CourseFormState {
  return {
    title: "",
    code: "",
    description: "",
    language: "ru",
    credits: "4",
    facultyId: "",
    departmentId: "",
    programId: "",
    semesterId: "semester-fall-2026",
    teacherId,
    startDate: "2026-09-01",
    endDate: "2026-12-24",
    coverDataUrl: "",
    coverName: "",
    syllabusName: "",
  };
}

export default function StaffCourseFormPage() {
  const { courseId } = useParams<RouteParams>();
  const history = useHistory();
  const location = useLocation();
  const session = getStaffSession();
  const isEditing = Boolean(courseId);
  const existingCourse = courseId ? getCourse(courseId) : null;
  const templateId = useMemo(
    () => new URLSearchParams(location.search).get("template"),
    [location.search],
  );
  const selectedTemplate = useMemo(
    () => (!isEditing && templateId ? getCourseTemplate(templateId) : null),
    [isEditing, templateId],
  );
  const defaultTeacherId = session?.role === "teacher" ? session.userId : mockTeachers[0]?.id ?? "";
  const [form, setForm] = useState<CourseFormState>(() => {
    if (!existingCourse) {
      const initial = getInitialForm(defaultTeacherId);
      return selectedTemplate
        ? {
            ...initial,
            title: selectedTemplate.name,
            description: selectedTemplate.description,
            language: selectedTemplate.language,
            credits: String(selectedTemplate.credits),
          }
        : initial;
    }
    return {
      title: existingCourse.title,
      code: existingCourse.code,
      description: existingCourse.description,
      language: existingCourse.language,
      credits: String(existingCourse.credits),
      facultyId: existingCourse.facultyId,
      departmentId: existingCourse.departmentId,
      programId: existingCourse.programId,
      semesterId: existingCourse.semesterId,
      teacherId: existingCourse.teacherId,
      startDate: existingCourse.startDate,
      endDate: existingCourse.endDate,
      coverDataUrl: existingCourse.coverDataUrl ?? "",
      coverName: existingCourse.coverName ?? "",
      syllabusName: existingCourse.syllabusName ?? "",
    };
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const allowNavigationRef = useRef(false);
  const closeToast = useCallback(() => setToast(null), []);

  const departments = useMemo(
    () => mockDepartments.filter((department) => department.facultyId === form.facultyId),
    [form.facultyId],
  );
  const programs = useMemo(
    () => mockPrograms.filter((program) => program.departmentId === form.departmentId),
    [form.departmentId],
  );
  const templateStats = useMemo(
    () => (selectedTemplate ? getCourseTemplateStats(selectedTemplate) : null),
    [selectedTemplate],
  );

  useEffect(() => {
    if (!isDirty) return;
    const unblock = history.block((location) => {
      if (allowNavigationRef.current) return undefined;
      setPendingPath(`${location.pathname}${location.search}${location.hash}`);
      return false;
    });
    return unblock;
  }, [history, isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  if (isEditing && !existingCourse) {
    return (
      <div className="grid min-h-96 place-items-center rounded-brand border-2 border-line p-6 text-center">
        <div>
          <h1 className="text-2xl font-black text-navy">Курс не найден</h1>
          <Link className="mt-4 inline-block text-sm font-black text-macaw-dark hover:underline" to="/courses">Вернуться к курсам</Link>
        </div>
      </div>
    );
  }

  const updateField = <Key extends keyof CourseFormState>(
    key: Key,
    value: CourseFormState[Key],
  ) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "facultyId") {
        next.departmentId = "";
        next.programId = "";
      }
      if (key === "departmentId") next.programId = "";
      if (key === "semesterId") {
        const semester = mockSemesters.find((item) => item.id === value);
        if (semester) {
          next.startDate = semester.startDate;
          next.endDate = semester.endDate;
        }
      }
      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
    setIsDirty(true);
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!form.title.trim()) nextErrors.title = "Введите название курса.";
    if (!form.code.trim()) nextErrors.code = "Введите code курса.";
    else if (!/^[A-ZА-ЯЁ0-9-]{3,12}$/i.test(form.code.trim())) nextErrors.code = "Используйте 3–12 букв, цифр или дефис.";
    else if (!isCourseCodeUnique(form.code, courseId)) nextErrors.code = "Курс с таким code уже существует.";
    if (!form.description.trim()) nextErrors.description = "Добавьте описание курса.";
    const credits = Number(form.credits);
    if (!Number.isFinite(credits) || credits < 1 || credits > 20) nextErrors.credits = "Укажите число от 1 до 20.";
    if (!form.facultyId) nextErrors.facultyId = "Выберите факультет.";
    if (!form.departmentId) nextErrors.departmentId = "Выберите кафедру.";
    if (!form.programId) nextErrors.programId = "Выберите программу.";
    if (!form.semesterId) nextErrors.semesterId = "Выберите семестр.";
    if (!form.teacherId) nextErrors.teacherId = "Выберите преподавателя.";
    if (!form.startDate) nextErrors.startDate = "Укажите дату начала.";
    if (!form.endDate) nextErrors.endDate = "Укажите дату окончания.";
    else if (form.startDate && form.endDate < form.startDate) nextErrors.endDate = "Дата окончания должна быть позже даты начала.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildInput = (): CourseInput => ({
    title: form.title,
    code: form.code,
    description: form.description,
    language: form.language,
    credits: Number(form.credits),
    facultyId: form.facultyId,
    departmentId: form.departmentId,
    programId: form.programId,
    semesterId: form.semesterId,
    teacherId: form.teacherId,
    startDate: form.startDate,
    endDate: form.endDate,
    coverDataUrl: form.coverDataUrl || undefined,
    coverName: form.coverName || undefined,
    syllabusName: form.syllabusName || undefined,
  });

  const saveCourse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const destination = submitter instanceof HTMLButtonElement ? submitter.value : "details";
    if (!session || !validate()) {
      setToast({ id: Date.now(), title: "Проверьте форму", description: "Исправьте отмеченные поля.", variant: "error" });
      return;
    }

    const saved = courseId
      ? updateCourse(courseId, buildInput(), session.userId)
      : selectedTemplate
        ? createCourseFromTemplate(selectedTemplate.id, buildInput(), session.userId)
        : createCourse(buildInput(), session.userId);
    allowNavigationRef.current = true;
    setIsDirty(false);
    history.push(destination === "builder" ? `/courses/${saved.id}/builder` : `/courses/${saved.id}`);
  };

  const handleCover = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((current) => ({ ...current, coverName: "Выберите изображение JPG, PNG или WEBP." }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateField("coverDataUrl", typeof reader.result === "string" ? reader.result : "");
      updateField("coverName", file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSyllabus = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "docx"].includes(extension)) {
      setErrors((current) => ({ ...current, syllabusName: "Допустимы PDF и DOCX." }));
      return;
    }
    updateField("syllabusName", file.name);
  };

  const leaveWithoutSaving = () => {
    if (!pendingPath) return;
    allowNavigationRef.current = true;
    history.push(pendingPath);
  };

  return (
    <div className="grid gap-6">
      <header>
        <Link className="inline-flex items-center gap-2 text-sm font-black text-ash hover:text-macaw-dark" to={courseId ? `/courses/${courseId}` : "/courses"}>
          <ArrowLeft aria-hidden="true" size={17} />
          Назад
        </Link>
        <span className="mt-5 block text-xs font-black uppercase tracking-[0.14em] text-ecto-dark">Course Management</span>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-navy sm:text-4xl">
          {isEditing ? "Редактирование курса" : "Создание курса"}
        </h1>
        <p className="mt-2 text-sm text-ash">
          {selectedTemplate
            ? "Проверьте основные данные — структура шаблона будет добавлена после сохранения."
            : "Заполните основную информацию и сохраните курс как черновик."}
        </p>
      </header>

      {existingCourse?.status === "published" ? <PublishedCourseNotice /> : null}

      {selectedTemplate && templateStats ? (
        <section className="flex flex-col gap-4 rounded-brand border-2 border-eel bg-eel/20 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-brand bg-ecto text-white"><BookCopy aria-hidden="true" size={21} /></span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-ecto-dark">Выбран шаблон</span>
              <h2 className="mt-1 text-lg font-black text-navy">{selectedTemplate.name}</h2>
              <p className="mt-1 text-xs font-bold text-ash">{templateStats.moduleCount} модулей · {templateStats.lessonCount} уроков · {templateStats.materialCount} материалов</p>
            </div>
          </div>
          <Link className="inline-flex min-h-10 items-center justify-center rounded-brand border-2 border-line bg-paper px-4 text-xs font-black text-graphite hover:border-lingot" to="/templates">Выбрать другой</Link>
        </section>
      ) : null}

      <form className="grid gap-6" noValidate onSubmit={saveCourse}>
        <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7">
          <h2 className="text-xl font-black text-navy">Основные данные</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <FormField error={errors.title} label="Название курса" required>
              <input className={inputClasses(errors.title)} onChange={(event) => updateField("title", event.target.value)} placeholder="Например, Современная веб-разработка" value={form.title} />
            </FormField>
            <FormField error={errors.code} label="Code" required>
              <input className={inputClasses(errors.code)} onChange={(event) => updateField("code", event.target.value.toUpperCase())} placeholder="CS101" value={form.code} />
            </FormField>
            <FormField className="md:col-span-2" error={errors.description} label="Описание" required>
              <textarea className={`${inputClasses(errors.description)} min-h-32 resize-y py-3`} onChange={(event) => updateField("description", event.target.value)} placeholder="Цели, содержание и ожидаемые результаты курса" value={form.description} />
            </FormField>
            <FormField label="Язык" required>
              <select className={inputClasses()} onChange={(event) => updateField("language", event.target.value as CourseLanguage)} value={form.language}>
                <option value="ru">Русский</option><option value="ky">Кыргызский</option><option value="en">English</option>
              </select>
            </FormField>
            <FormField error={errors.credits} label="Кредиты" required>
              <input className={inputClasses(errors.credits)} min="1" max="20" onChange={(event) => updateField("credits", event.target.value)} type="number" value={form.credits} />
            </FormField>
          </div>
        </section>

        <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7">
          <h2 className="text-xl font-black text-navy">Организация и период</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <FormField error={errors.facultyId} label="Факультет" required>
              <select className={inputClasses(errors.facultyId)} onChange={(event) => updateField("facultyId", event.target.value)} value={form.facultyId}>
                <option value="">Выберите факультет</option>
                {mockFaculties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </FormField>
            <FormField error={errors.departmentId} label="Кафедра" required>
              <select className={inputClasses(errors.departmentId)} disabled={!form.facultyId} onChange={(event) => updateField("departmentId", event.target.value)} value={form.departmentId}>
                <option value="">Выберите кафедру</option>
                {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </FormField>
            <FormField error={errors.programId} label="Программа" required>
              <select className={inputClasses(errors.programId)} disabled={!form.departmentId} onChange={(event) => updateField("programId", event.target.value)} value={form.programId}>
                <option value="">Выберите программу</option>
                {programs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </FormField>
            <FormField error={errors.semesterId} label="Семестр" required>
              <select className={inputClasses(errors.semesterId)} onChange={(event) => updateField("semesterId", event.target.value)} value={form.semesterId}>
                {mockSemesters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </FormField>
            <FormField error={errors.teacherId} label="Преподаватель" required>
              <select className={inputClasses(errors.teacherId)} disabled={session?.role === "teacher"} onChange={(event) => updateField("teacherId", event.target.value)} value={form.teacherId}>
                {mockTeachers.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}
              </select>
            </FormField>
            <div className="hidden xl:block" />
            <FormField error={errors.startDate} label="Дата начала" required>
              <input className={inputClasses(errors.startDate)} onChange={(event) => updateField("startDate", event.target.value)} type="date" value={form.startDate} />
            </FormField>
            <FormField error={errors.endDate} label="Дата окончания" required>
              <input className={inputClasses(errors.endDate)} onChange={(event) => updateField("endDate", event.target.value)} type="date" value={form.endDate} />
            </FormField>
          </div>
        </section>

        <section className="rounded-brand border-2 border-line bg-paper p-5 lg:p-7">
          <h2 className="text-xl font-black text-navy">Файлы курса</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="rounded-brand border-2 border-dashed border-line p-4">
              <div className="flex items-center gap-3"><ImagePlus aria-hidden="true" className="text-macaw-dark" size={22} /><strong className="text-sm font-black text-graphite">Обложка</strong></div>
              {form.coverDataUrl ? <img alt="Предпросмотр обложки курса" className="mt-4 aspect-[16/7] w-full rounded-brand border-2 border-line object-cover" src={form.coverDataUrl} /> : null}
              {form.coverName ? <div className="mt-3 flex items-center justify-between gap-2 text-xs font-bold text-ash"><span className="truncate">{form.coverName}</span><button aria-label="Удалить обложку" onClick={() => { updateField("coverDataUrl", ""); updateField("coverName", ""); }} type="button"><X aria-hidden="true" size={16} /></button></div> : null}
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-brand border-2 border-line px-4 py-2 text-xs font-black text-graphite hover:border-lingot">
                <Upload aria-hidden="true" size={16} /> Выбрать изображение
                <input accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleCover} type="file" />
              </label>
              {errors.coverName ? <p className="mt-2 text-xs font-bold text-danger">{errors.coverName}</p> : null}
            </div>
            <div className="rounded-brand border-2 border-dashed border-line p-4">
              <div className="flex items-center gap-3"><FileText aria-hidden="true" className="text-macaw-dark" size={22} /><strong className="text-sm font-black text-graphite">Syllabus</strong></div>
              {form.syllabusName ? <div className="mt-4 flex items-center justify-between gap-2 rounded-brand bg-mist p-3 text-xs font-bold text-graphite"><span className="truncate">{form.syllabusName}</span><button aria-label="Удалить syllabus" onClick={() => updateField("syllabusName", "")} type="button"><X aria-hidden="true" size={16} /></button></div> : null}
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-brand border-2 border-line px-4 py-2 text-xs font-black text-graphite hover:border-lingot">
                <Upload aria-hidden="true" size={16} /> Выбрать PDF или DOCX
                <input accept=".pdf,.docx" className="sr-only" onChange={handleSyllabus} type="file" />
              </label>
              {errors.syllabusName ? <p className="mt-2 text-xs font-bold text-danger">{errors.syllabusName}</p> : null}
            </div>
          </div>
        </section>

        <div className="sticky bottom-3 z-20 flex flex-col-reverse gap-3 rounded-brand border-2 border-line bg-paper/95 p-3 backdrop-blur sm:flex-row sm:justify-end">
          <Link className="inline-flex min-h-12 items-center justify-center rounded-brand border-2 border-line px-5 text-sm font-black text-graphite hover:bg-mist" to={courseId ? `/courses/${courseId}` : "/courses"}>Отмена</Link>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto px-5 text-sm font-black text-ecto-dark hover:bg-ecto/10" name="destination" type="submit" value="details">
            <Save aria-hidden="true" size={18} />
            {isEditing ? "Сохранить изменения" : "Сохранить черновик"}
          </button>
          <button className="student-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white" name="destination" type="submit" value="builder">
            <Save aria-hidden="true" size={18} /> Сохранить и продолжить
          </button>
        </div>
      </form>

      <ConfirmDialog confirmLabel="Выйти" description="Все несохранённые изменения формы будут потеряны." isOpen={Boolean(pendingPath)} onCancel={() => setPendingPath(null)} onConfirm={leaveWithoutSaving} title="У вас есть несохранённые изменения" />
      <StaffToast message={toast} onClose={closeToast} />
    </div>
  );
}

function inputClasses(error?: string): string {
  return `min-h-12 w-full rounded-brand border-2 bg-paper px-3 text-sm font-bold text-graphite outline-none disabled:bg-mist disabled:text-ash ${error ? "border-danger" : "border-line focus:border-macaw"}`;
}

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
  error?: string;
  label: string;
  required?: boolean;
}

function FormField({ children, className = "", error, label, required }: FormFieldProps) {
  return (
    <label className={`grid content-start gap-2 ${className}`}>
      <span className="text-xs font-black uppercase tracking-wider text-ash">
        {label}{required ? <span className="ml-1 text-danger">*</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs font-bold text-danger">{error}</span> : null}
    </label>
  );
}
