import { Download, ExternalLink, FileText, Pencil, Play, Plus, Trash2, Upload, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { learningApi, resolveApiResourceUrl } from "../../api/learning.api";
import type { LearningMaterialDto, LearningMaterialType } from "../../api/learning.api";
import { useAuth } from "../../auth/useAuth";
import { formatLearningFileSize, learningMaterialTypeLabels, saveBlob } from "../../utils/learningDisplay";
import ConfirmDialog from "../student/ConfirmDialog";
import StatePanel from "../student/StatePanel";

interface ApiMaterialManagerProps {
  editable: boolean;
  error?: string;
  isLoading: boolean;
  lessonId: number;
  materials: LearningMaterialDto[];
  onChanged: (message: string) => Promise<void>;
}

const acceptByType: Partial<Record<LearningMaterialType, string>> = {
  pdf: ".pdf",
  doc: ".doc",
  docx: ".docx",
  ppt: ".ppt",
  pptx: ".pptx",
  image: "image/png,image/jpeg,image/gif,image/webp",
  audio: "audio/mpeg,audio/ogg,audio/wav,audio/mp4,audio/flac",
  video: "video/mp4,video/webm,video/ogg,video/quicktime",
  other: ".csv,.json,.md,.rtf,.txt,.xml",
};

export default function ApiMaterialManager({ editable, error, isLoading, lessonId, materials, onChanged }: ApiMaterialManagerProps) {
  const { can } = useAuth();
  const [formTarget, setFormTarget] = useState<LearningMaterialDto | "create" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LearningMaterialDto | null>(null);
  const [actionError, setActionError] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const deleteMutation = useMutation({
    mutationFn: (materialId: number) => learningApi.deleteMaterial(materialId),
    onSuccess: async () => {
      setPendingDelete(null);
      await onChanged("Материал удалён");
    },
  });
  const displayedError = error || actionError || deleteMutation.error?.message;

  const download = async (material: LearningMaterialDto) => {
    setActionError("");
    setDownloadingId(material.id);
    try {
      const blob = await learningApi.downloadMaterial(material.id);
      saveBlob(blob, material.original_filename || material.title);
    } catch (downloadError) {
      setActionError(downloadError instanceof Error ? downloadError.message : "Не удалось скачать материал.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <section className="rounded-brand border-2 border-line bg-paper p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-ecto-dark">Learning Materials</span><h2 className="mt-1 text-xl font-black text-navy">Материалы урока</h2><p className="mt-1 text-sm text-ash">Файлы, видео и внешние ресурсы: {materials.length}</p></div>
        {editable && can("materials.upload") ? <button className="student-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white" onClick={() => setFormTarget("create")} type="button"><Plus aria-hidden="true" size={17} /> Добавить материал</button> : null}
      </div>

      {displayedError ? <p className="mt-4 rounded-brand border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{displayedError}</p> : null}
      {isLoading ? <div className="mt-5"><StatePanel description="Получаем материалы урока." kind="loading" title="Загрузка материалов" /></div> : materials.length ? <div className="mt-5 grid gap-3">{materials.map((material) => (
        <article className="grid gap-3 rounded-brand border-2 border-line p-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center" key={material.id}>
          <span className="grid size-11 place-items-center rounded-brand bg-mist text-macaw-dark"><FileText aria-hidden="true" size={21} /></span>
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-black text-graphite">{material.title}</h3><span className="rounded-brand border-2 border-line px-2 py-0.5 text-[10px] font-black text-ash">{learningMaterialTypeLabels[material.type]}</span>{material.video_status ? <span className="rounded-brand bg-warning/15 px-2 py-1 text-[10px] font-black text-warning-dark">Видео: {material.video_status}</span> : null}</div><p className="mt-1 truncate text-xs text-ash">{material.original_filename || material.external_url || "Backend resource"} · {formatLearningFileSize(material.size)}</p>{material.description ? <p className="mt-1 line-clamp-2 text-xs text-ash">{material.description}</p> : null}</div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {material.external_url ? <a className="inline-flex min-h-10 items-center gap-2 rounded-brand border-2 border-line px-3 text-xs font-black text-graphite hover:border-macaw" href={material.external_url} rel="noreferrer" target="_blank"><ExternalLink aria-hidden="true" size={15} /> Открыть</a> : null}
            {material.playback_url ? <a className="inline-flex min-h-10 items-center gap-2 rounded-brand border-2 border-macaw px-3 text-xs font-black text-macaw-dark hover:bg-macaw/10" href={resolveApiResourceUrl(material.playback_url)} rel="noreferrer" target="_blank"><Play aria-hidden="true" size={15} /> Смотреть</a> : null}
            {material.download_url && material.download_allowed ? <button className="inline-flex min-h-10 items-center gap-2 rounded-brand border-2 border-line px-3 text-xs font-black text-graphite hover:border-macaw disabled:opacity-50" disabled={downloadingId === material.id} onClick={() => download(material)} type="button"><Download aria-hidden="true" size={15} /> {downloadingId === material.id ? "Загрузка…" : "Скачать"}</button> : null}
            {editable && can("materials.edit") ? <button aria-label={`Изменить ${material.title}`} className="grid size-10 place-items-center rounded-brand border-2 border-line text-ash hover:border-macaw hover:text-macaw-dark" onClick={() => setFormTarget(material)} type="button"><Pencil aria-hidden="true" size={16} /></button> : null}
            {editable && can("materials.delete") ? <button aria-label={`Удалить ${material.title}`} className="grid size-10 place-items-center rounded-brand border-2 border-red-200 text-red-700 hover:bg-red-50" onClick={() => setPendingDelete(material)} type="button"><Trash2 aria-hidden="true" size={16} /></button> : null}
          </div>
        </article>
      ))}</div> : <div className="mt-5 rounded-brand border-2 border-dashed border-line bg-mist p-8 text-center"><FileText aria-hidden="true" className="mx-auto text-ash" size={32} /><h3 className="mt-3 text-base font-black text-navy">Материалов пока нет</h3><p className="mt-1 text-sm text-ash">Добавьте файл, видео или ссылку к этому уроку.</p></div>}

      {formTarget ? <MaterialFormDialog editing={formTarget === "create" ? null : formTarget} lessonId={lessonId} onClose={() => setFormTarget(null)} onSaved={async (message) => { setFormTarget(null); await onChanged(message); }} /> : null}
      <ConfirmDialog confirmLabel="Удалить" description={pendingDelete ? `Материал «${pendingDelete.title}» будет удалён без возможности восстановления.` : ""} isOpen={Boolean(pendingDelete)} onCancel={() => setPendingDelete(null)} onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)} title="Удалить материал?" />
    </section>
  );
}

function MaterialFormDialog({ editing, lessonId, onClose, onSaved }: { editing: LearningMaterialDto | null; lessonId: number; onClose: () => void; onSaved: (message: string) => Promise<void> }) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [type, setType] = useState<LearningMaterialType>(editing?.type ?? "pdf");
  const [externalUrl, setExternalUrl] = useState(editing?.external_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [downloadAllowed, setDownloadAllowed] = useState(editing?.download_allowed ?? true);
  const isLink = type === "external_link" || type === "library_link";
  const isInvalid = !title.trim() || (!editing && (isLink ? !isValidHttpUrl(externalUrl) : !file));
  const mutation = useMutation({
    mutationFn: () => {
      if (editing) return learningApi.updateMaterial(editing.id, { title: title.trim(), description: description.trim(), ...(isLink ? { external_url: externalUrl.trim() } : {}), download_allowed: downloadAllowed });
      if (isLink) return learningApi.createLinkMaterial(lessonId, { title: title.trim(), description: description.trim(), type, external_url: externalUrl.trim(), download_allowed: false });
      if (!file) throw new Error("Выберите файл.");
      return learningApi.uploadMaterial(lessonId, { title: title.trim(), description: description.trim(), type, file, downloadAllowed });
    },
    onSuccess: () => onSaved(editing ? "Материал обновлён" : "Материал добавлен"),
  });

  return <div aria-labelledby="api-material-form-title" aria-modal="true" className="fixed inset-0 z-[115] grid place-items-center bg-midnight/75 p-4" role="dialog"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-brand border-2 border-line bg-paper"><header className="flex items-start justify-between gap-4 border-b-2 border-line p-5"><div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-ecto-dark">Learning Material</span><h2 className="mt-1 text-xl font-black text-navy" id="api-material-form-title">{editing ? "Редактирование материала" : "Новый материал"}</h2></div><button aria-label="Закрыть" className="grid size-10 place-items-center rounded-brand border-2 border-line text-ash" disabled={mutation.isPending} onClick={onClose} type="button"><X aria-hidden="true" size={18} /></button></header><div className="grid gap-5 p-5 sm:grid-cols-2"><Field className="sm:col-span-2" label="Название" required><input autoFocus className={inputClasses} maxLength={255} onChange={(event) => setTitle(event.target.value)} value={title} /></Field><Field className="sm:col-span-2" label="Описание"><textarea className={`${inputClasses} min-h-24 py-3`} onChange={(event) => setDescription(event.target.value)} value={description} /></Field>{!editing ? <Field label="Тип"><select className={inputClasses} onChange={(event) => { setType(event.target.value as LearningMaterialType); setFile(null); }} value={type}>{(Object.entries(learningMaterialTypeLabels) as Array<[LearningMaterialType, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field> : <Field label="Тип"><div className="flex min-h-12 items-center rounded-brand border-2 border-line bg-mist px-3 text-sm font-bold text-graphite">{learningMaterialTypeLabels[type]}</div></Field>}{isLink ? <Field className="sm:col-span-2" label="URL" required><input className={inputClasses} onChange={(event) => setExternalUrl(event.target.value)} placeholder="https://example.com/resource" type="url" value={externalUrl} /></Field> : !editing ? <Field className="sm:col-span-2" label="Файл" required><label className="flex min-h-24 cursor-pointer items-center justify-center gap-3 rounded-brand border-2 border-dashed border-line px-4 text-sm font-black text-ash hover:border-macaw"><Upload aria-hidden="true" size={20} />{file ? `${file.name} · ${formatLearningFileSize(file.size)}` : `Выбрать ${learningMaterialTypeLabels[type]}`}<input accept={acceptByType[type]} className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} type="file" /></label></Field> : null}{!isLink ? <label className="flex min-h-12 items-center gap-3 self-end rounded-brand border-2 border-line px-4 text-sm font-black text-graphite"><input checked={downloadAllowed} className="size-5 accent-[#27a8e0]" onChange={(event) => setDownloadAllowed(event.target.checked)} type="checkbox" /> Разрешить скачивание</label> : null}</div>{mutation.error ? <p className="mx-5 mb-2 rounded-brand border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{mutation.error.message}</p> : null}<footer className="flex gap-3 border-t-2 border-line p-4 sm:justify-end"><button className="min-h-11 flex-1 rounded-brand border-2 border-line px-5 text-sm font-black text-graphite sm:flex-none" disabled={mutation.isPending} onClick={onClose} type="button">Отмена</button><button className="student-pressable min-h-11 flex-1 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white disabled:opacity-50 sm:flex-none" disabled={isInvalid || mutation.isPending} onClick={() => mutation.mutate()} type="button">{mutation.isPending ? "Сохранение…" : "Сохранить"}</button></footer></div></div>;
}

const inputClasses = "min-h-12 w-full rounded-brand border-2 border-line bg-paper px-3 text-sm font-bold text-graphite outline-none focus:border-macaw";
function Field({ children, className, label, required = false }: { children: React.ReactNode; className?: string; label: string; required?: boolean }) { return <label className={`grid content-start gap-2 ${className ?? ""}`}><span className="text-xs font-black uppercase tracking-wider text-ash">{label}{required ? <span className="ml-1 text-danger">*</span> : null}</span>{children}</label>; }
function isValidHttpUrl(value: string): boolean { try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } }
