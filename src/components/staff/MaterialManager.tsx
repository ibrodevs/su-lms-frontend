import {
  ArrowDown,
  ArrowUp,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Headphones,
  Image as ImageIcon,
  Library,
  Plus,
  Presentation,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  createMaterial,
  deleteMaterial,
  duplicateMaterial,
  moveMaterial,
  updateMaterial,
} from "../../services/materialService";
import type { MaterialInput, StaffMaterial, StaffMaterialAvailability, StaffMaterialType } from "../../types/staff";
import { cn } from "../../utils/cn";
import { formatFileSize, staffMaterialTypeLabels } from "../../utils/materialDisplay";
import ConfirmDialog from "../student/ConfirmDialog";
import MaterialPreviewDialog from "./MaterialPreviewDialog";

interface MaterialManagerProps {
  lessonId: string;
  materials: StaffMaterial[];
  userId: string;
  onChanged: (message: string) => void;
}

const materialIcons: Record<StaffMaterialType, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  pptx: Presentation,
  image: ImageIcon,
  audio: Headphones,
  video: Video,
  external: ExternalLink,
  library: Library,
};

const fileExtensions: Partial<Record<StaffMaterialType, string[]>> = {
  pdf: ["pdf"],
  docx: ["docx"],
  pptx: ["pptx"],
  image: ["png", "jpg", "jpeg", "webp"],
  audio: ["mp3", "wav", "ogg"],
  video: ["mp4", "webm", "mov"],
};

const acceptByType: Partial<Record<StaffMaterialType, string>> = {
  pdf: ".pdf",
  docx: ".docx",
  pptx: ".pptx",
  image: "image/png,image/jpeg,image/webp",
  audio: "audio/mpeg,audio/wav,audio/ogg",
  video: "video/mp4,video/webm,video/quicktime",
};

interface MaterialFormState {
  title: string;
  description: string;
  type: StaffMaterialType;
  fileName: string;
  sizeBytes?: number;
  url: string;
  pageCount: string;
  durationMinutes: string;
  downloadAllowed: boolean;
  availability: StaffMaterialAvailability;
}

const emptyMaterialForm: MaterialFormState = {
  title: "",
  description: "",
  type: "pdf",
  fileName: "",
  url: "",
  pageCount: "",
  durationMinutes: "",
  downloadAllowed: true,
  availability: "available",
};

function toFormState(material?: StaffMaterial): MaterialFormState {
  if (!material) return emptyMaterialForm;
  return {
    title: material.title,
    description: material.description,
    type: material.type,
    fileName: material.fileName ?? "",
    sizeBytes: material.sizeBytes,
    url: material.url ?? "",
    pageCount: material.pageCount ? String(material.pageCount) : "",
    durationMinutes: material.durationMinutes ? String(material.durationMinutes) : "",
    downloadAllowed: material.downloadAllowed,
    availability: material.availability,
  };
}

function inputClasses(error?: string): string {
  return `min-h-11 w-full rounded-brand border-2 bg-paper px-3 text-sm font-bold text-graphite outline-none ${error ? "border-danger" : "border-line focus:border-macaw"}`;
}

interface FormFieldProps {
  children: React.ReactNode;
  label: string;
  error?: string;
  required?: boolean;
}

function FormField({ children, error, label, required = false }: FormFieldProps) {
  return <label className="grid content-start gap-2"><span className="text-xs font-black uppercase tracking-wider text-ash">{label}{required ? <span className="ml-1 text-danger">*</span> : null}</span>{children}{error ? <span className="text-xs font-bold text-danger">{error}</span> : null}</label>;
}

interface MaterialFormDialogProps {
  editing: StaffMaterial | null;
  isOpen: boolean;
  lessonId: string;
  userId: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}

function MaterialFormDialog({ editing, isOpen, lessonId, onClose, onSaved, userId }: MaterialFormDialogProps) {
  const [form, setForm] = useState<MaterialFormState>(emptyMaterialForm);
  const [errors, setErrors] = useState<{ title?: string; source?: string; file?: string }>({});

  useEffect(() => {
    if (!isOpen) return;
    setForm(toFormState(editing ?? undefined));
    setErrors({});
  }, [editing, isOpen]);

  if (!isOpen) return null;
  const isLink = form.type === "external" || form.type === "library";

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const allowed = fileExtensions[form.type] ?? [];
    if (!allowed.includes(extension)) {
      setErrors((current) => ({ ...current, file: `Допустимые форматы: ${allowed.join(", ").toUpperCase()}.` }));
      event.target.value = "";
      return;
    }
    setForm((current) => ({ ...current, fileName: file.name, sizeBytes: file.size, title: current.title || file.name.replace(/\.[^.]+$/, "") }));
    setErrors((current) => ({ ...current, file: undefined, source: undefined }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!form.title.trim()) nextErrors.title = "Введите название материала.";
    if (isLink) {
      try {
        const parsed = new URL(form.url);
        if (!/^https?:$/.test(parsed.protocol)) nextErrors.source = "Используйте ссылку HTTP или HTTPS.";
      } catch {
        nextErrors.source = "Введите корректную ссылку HTTP или HTTPS.";
      }
    } else if (form.url && !form.url.startsWith("/") && !/^https?:\/\//i.test(form.url)) {
      nextErrors.source = "Используйте относительный путь или ссылку HTTP/HTTPS.";
    } else if (!form.fileName && !form.url) {
      nextErrors.file = "Выберите mock-файл или укажите URL.";
    }
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    const input: MaterialInput = {
      title: form.title,
      description: form.description,
      type: form.type,
      fileName: form.fileName || undefined,
      sizeBytes: form.sizeBytes,
      url: form.url || undefined,
      pageCount: form.pageCount ? Number(form.pageCount) : undefined,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      downloadAllowed: form.downloadAllowed,
      availability: form.availability,
    };
    if (editing) updateMaterial(editing.id, input, userId);
    else createMaterial(lessonId, input, userId);
    onSaved(editing ? "Материал сохранён" : "Материал добавлен");
  };

  return (
    <div aria-labelledby="material-form-title" aria-modal="true" className="fixed inset-0 z-[110] grid place-items-center bg-midnight/75 p-3 sm:p-6" role="dialog">
      <form className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-brand border-2 border-line bg-paper" noValidate onSubmit={submit}>
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b-2 border-line bg-paper p-4 sm:p-5"><div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-ecto-dark">Learning Material</span><h2 className="mt-1 text-xl font-black text-navy" id="material-form-title">{editing ? "Редактирование материала" : "Новый материал"}</h2></div><button aria-label="Закрыть форму материала" className="grid size-10 place-items-center rounded-brand border-2 border-line text-ash hover:bg-mist" onClick={onClose} type="button"><X aria-hidden="true" size={18} /></button></header>
        <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5">
          <FormField label="Тип материала" required><select className={inputClasses()} onChange={(event) => { const type = event.target.value as StaffMaterialType; setForm((current) => ({ ...current, type, fileName: "", sizeBytes: undefined, url: "", downloadAllowed: type !== "external" && type !== "library" })); setErrors({}); }} value={form.type}>{(Object.entries(staffMaterialTypeLabels) as Array<[StaffMaterialType, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField>
          <FormField label="Доступность"><select className={inputClasses()} onChange={(event) => setForm((current) => ({ ...current, availability: event.target.value as StaffMaterialAvailability }))} value={form.availability}><option value="available">Доступен</option><option value="unavailable">Недоступен</option><option value="error">Ошибка загрузки</option></select></FormField>
          <div className="sm:col-span-2"><FormField error={errors.title} label="Название" required><input autoFocus className={inputClasses(errors.title)} onChange={(event) => { setForm((current) => ({ ...current, title: event.target.value })); setErrors((current) => ({ ...current, title: undefined })); }} placeholder="Например, Конспект по архитектуре" value={form.title} /></FormField></div>
          <div className="sm:col-span-2"><FormField label="Описание"><textarea className={`${inputClasses()} min-h-24 resize-y py-3`} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Кратко объясните назначение материала" value={form.description} /></FormField></div>

          {isLink ? <div className="sm:col-span-2"><FormField error={errors.source} label="URL ресурса" required><input className={inputClasses(errors.source)} onChange={(event) => { setForm((current) => ({ ...current, url: event.target.value })); setErrors((current) => ({ ...current, source: undefined })); }} placeholder="https://example.com/resource" type="url" value={form.url} /></FormField></div> : (
            <>
              <div className="sm:col-span-2"><FormField error={errors.file} label="Mock-файл" required><label className={cn("flex min-h-24 cursor-pointer items-center justify-center gap-3 rounded-brand border-2 border-dashed px-4 text-sm font-black", errors.file ? "border-danger text-danger" : "border-line text-ash hover:border-macaw hover:text-macaw-dark")}><Upload aria-hidden="true" size={20} />{form.fileName ? `${form.fileName} · ${formatFileSize(form.sizeBytes)}` : `Выбрать ${staffMaterialTypeLabels[form.type]}`}<input accept={acceptByType[form.type]} className="sr-only" onChange={handleFile} type="file" /></label></FormField></div>
              <div className="sm:col-span-2"><FormField error={errors.source} label="Mock URL (необязательно)"><input className={inputClasses(errors.source)} onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} placeholder="/materials/file.pdf или https://..." value={form.url} /></FormField></div>
            </>
          )}

          {form.type === "pdf" ? <FormField label="Количество страниц"><input className={inputClasses()} min="1" onChange={(event) => setForm((current) => ({ ...current, pageCount: event.target.value }))} type="number" value={form.pageCount} /></FormField> : null}
          {form.type === "audio" || form.type === "video" ? <FormField label="Длительность, мин"><input className={inputClasses()} min="1" onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))} type="number" value={form.durationMinutes} /></FormField> : null}
          {!isLink ? <label className="flex min-h-11 items-center gap-3 rounded-brand border-2 border-line px-4 text-sm font-black text-graphite sm:self-end"><input checked={form.downloadAllowed} className="size-5 accent-[#27a8e0]" onChange={(event) => setForm((current) => ({ ...current, downloadAllowed: event.target.checked }))} type="checkbox" /> Разрешить скачивание</label> : null}
        </div>
        <footer className="sticky bottom-0 flex flex-col-reverse gap-3 border-t-2 border-line bg-paper p-4 sm:flex-row sm:justify-end"><button className="min-h-11 rounded-brand border-2 border-line px-5 text-sm font-black text-graphite hover:bg-mist" onClick={onClose} type="button">Отмена</button><button className="student-pressable min-h-11 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white" type="submit">{editing ? "Сохранить материал" : "Добавить материал"}</button></footer>
      </form>
    </div>
  );
}

interface MaterialRowProps {
  index: number;
  material: StaffMaterial;
  total: number;
  onDelete: (material: StaffMaterial) => void;
  onDuplicate: (material: StaffMaterial) => void;
  onEdit: (material: StaffMaterial) => void;
  onMove: (material: StaffMaterial, direction: "up" | "down") => void;
  onPreview: (material: StaffMaterial) => void;
}

function MaterialRow({ index, material, onDelete, onDuplicate, onEdit, onMove, onPreview, total }: MaterialRowProps) {
  const Icon = materialIcons[material.type];
  return (
    <article className="grid min-w-0 gap-3 rounded-brand border-2 border-line bg-paper p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
      <span className="grid size-11 place-items-center rounded-brand bg-mist text-macaw-dark"><Icon aria-hidden="true" size={21} /></span>
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="truncate text-sm font-black text-graphite">{material.title}</strong><span className="rounded-brand border-2 border-line px-2 py-0.5 text-[10px] font-black text-ash">{staffMaterialTypeLabels[material.type]}</span><span className={cn("rounded-brand px-2 py-1 text-[10px] font-black", material.availability === "available" ? "bg-ecto/15 text-ecto-dark" : material.availability === "error" ? "bg-danger/10 text-danger" : "bg-warning/15 text-warning-dark")}>{material.availability === "available" ? "Доступен" : material.availability === "error" ? "Ошибка" : "Недоступен"}</span></div><p className="mt-1 truncate text-xs text-ash">{material.fileName ?? material.url ?? "Mock-источник"} · {formatFileSize(material.sizeBytes)}</p></div>
      <div className="flex flex-wrap justify-end gap-1">
        <MaterialAction label={`Просмотреть ${material.title}`} onClick={() => onPreview(material)}><Eye aria-hidden="true" size={15} /></MaterialAction>
        <MaterialAction label={`Редактировать ${material.title}`} onClick={() => onEdit(material)}><Edit3 aria-hidden="true" size={15} /></MaterialAction>
        <MaterialAction disabled={index === 0} label={`Поднять ${material.title}`} onClick={() => onMove(material, "up")}><ArrowUp aria-hidden="true" size={15} /></MaterialAction>
        <MaterialAction disabled={index === total - 1} label={`Опустить ${material.title}`} onClick={() => onMove(material, "down")}><ArrowDown aria-hidden="true" size={15} /></MaterialAction>
        <MaterialAction label={`Дублировать ${material.title}`} onClick={() => onDuplicate(material)}><Copy aria-hidden="true" size={15} /></MaterialAction>
        <MaterialAction danger label={`Удалить ${material.title}`} onClick={() => onDelete(material)}><Trash2 aria-hidden="true" size={15} /></MaterialAction>
      </div>
    </article>
  );
}

function MaterialAction({ children, danger = false, disabled = false, label, onClick }: { children: React.ReactNode; danger?: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  return <button aria-label={label} className={cn("grid size-9 place-items-center rounded-brand border-2 border-line text-ash hover:bg-mist hover:text-graphite disabled:cursor-not-allowed disabled:opacity-30", danger ? "hover:border-danger hover:text-danger" : "")} disabled={disabled} onClick={onClick} title={label} type="button">{children}</button>;
}

export default function MaterialManager({ lessonId, materials, onChanged, userId }: MaterialManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMaterial | null>(null);
  const [preview, setPreview] = useState<StaffMaterial | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StaffMaterial | null>(null);

  const openCreate = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (material: StaffMaterial) => { setEditing(material); setIsFormOpen(true); };
  const closeForm = () => { setIsFormOpen(false); setEditing(null); };
  const saved = (message: string) => { closeForm(); onChanged(message); };
  const duplicate = (material: StaffMaterial) => { duplicateMaterial(material.id, userId); onChanged("Материал продублирован"); };
  const move = (material: StaffMaterial, direction: "up" | "down") => { if (moveMaterial(material.id, direction, userId)) onChanged("Порядок материалов обновлён"); };
  const confirmDelete = () => { if (!pendingDelete) return; deleteMaterial(pendingDelete.id, userId); setPendingDelete(null); onChanged("Материал удалён"); };

  return (
    <section className="rounded-brand border-2 border-line bg-paper p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-ecto-dark">Learning Materials</span><h2 className="mt-1 text-xl font-black text-navy">Материалы урока</h2><p className="mt-1 text-sm text-ash">Файлы, медиа и внешние учебные ресурсы: {materials.length}</p></div><button className="student-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white" onClick={openCreate} type="button"><Plus aria-hidden="true" size={17} /> Добавить материал</button></div>
      <div className="mt-5 grid gap-3">
        {materials.length ? materials.map((material, index) => <MaterialRow index={index} key={material.id} material={material} onDelete={setPendingDelete} onDuplicate={duplicate} onEdit={openEdit} onMove={move} onPreview={setPreview} total={materials.length} />) : <div className="rounded-brand border-2 border-dashed border-line bg-mist p-8 text-center"><FileText aria-hidden="true" className="mx-auto text-ash" size={32} /><h3 className="mt-3 text-base font-black text-navy">Материалов пока нет</h3><p className="mt-1 text-sm text-ash">Добавьте файл, медиа или ссылку к этому уроку.</p></div>}
      </div>
      <MaterialFormDialog editing={editing} isOpen={isFormOpen} lessonId={lessonId} onClose={closeForm} onSaved={saved} userId={userId} />
      <MaterialPreviewDialog material={preview} onClose={() => setPreview(null)} />
      <ConfirmDialog confirmLabel="Удалить" description={pendingDelete ? `Материал «${pendingDelete.title}» будет удалён из урока. Действие нельзя отменить.` : ""} isOpen={Boolean(pendingDelete)} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} title="Удалить материал?" />
    </section>
  );
}
