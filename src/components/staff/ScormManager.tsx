import { ExternalLink, FileArchive, Upload } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { learningApi, resolveApiResourceUrl } from "../../api/learning.api";
import type { ScormPackageDto } from "../../api/learning.api";
import { useAuth } from "../../auth/useAuth";

interface ScormManagerProps {
  editable: boolean;
  error?: string;
  isLoading: boolean;
  lessonId: number;
  onChanged: (message: string) => Promise<void>;
  packages: ScormPackageDto[];
}

export default function ScormManager({ editable, error, isLoading, lessonId, onChanged, packages }: ScormManagerProps) {
  const { can } = useAuth();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Выберите SCORM ZIP-пакет.");
      return learningApi.uploadScorm(lessonId, title.trim(), file);
    },
    onSuccess: async () => {
      setTitle("");
      setFile(null);
      await onChanged("SCORM-пакет загружен и проверен");
    },
  });

  return (
    <section className="rounded-brand border-2 border-line bg-paper p-4 sm:p-6">
      <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-ecto-dark">SCORM 1.2 / 2004</span><h2 className="mt-1 text-xl font-black text-navy">SCORM-пакеты</h2><p className="mt-1 text-sm text-ash">Backend проверяет ZIP, manifest и безопасный launch path.</p></div>
      {error || mutation.error ? <p className="mt-4 rounded-brand border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{error ?? mutation.error?.message}</p> : null}
      {isLoading ? <div className="mt-5 h-20 animate-pulse rounded-brand bg-mist" aria-label="Загрузка SCORM-пакетов" /> : packages.length ? <div className="mt-5 grid gap-3">{packages.map((item) => <article className="flex flex-col gap-3 rounded-brand border-2 border-line p-4 sm:flex-row sm:items-center sm:justify-between" key={item.id}><div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-brand bg-mist text-macaw-dark"><FileArchive aria-hidden="true" size={21} /></span><div className="min-w-0"><h3 className="truncate text-sm font-black text-graphite">{item.title}</h3><p className="mt-1 text-xs text-ash">SCORM {item.version || "—"} · {item.status}</p></div></div>{item.launch_url ? <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-brand border-2 border-ecto px-3 text-xs font-black text-ecto-dark hover:bg-ecto/10" href={resolveApiResourceUrl(item.launch_url)} rel="noreferrer" target="_blank">Запустить <ExternalLink aria-hidden="true" size={15} /></a> : null}</article>)}</div> : <div className="mt-5 rounded-brand border-2 border-dashed border-line bg-mist p-6 text-center text-sm text-ash">SCORM-пакетов пока нет.</div>}

      {editable && can("materials.upload") ? <div className="mt-5 grid gap-3 rounded-brand border-2 border-line bg-mist p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"><label className="grid gap-2"><span className="text-xs font-black uppercase tracking-wider text-ash">Название</span><input className="min-h-11 rounded-brand border-2 border-line bg-paper px-3 text-sm font-bold outline-none focus:border-macaw" onChange={(event) => setTitle(event.target.value)} placeholder="Например, Интерактивный модуль" value={title} /></label><label className="grid gap-2"><span className="text-xs font-black uppercase tracking-wider text-ash">ZIP-пакет</span><span className="flex min-h-11 cursor-pointer items-center gap-2 rounded-brand border-2 border-dashed border-line bg-paper px-3 text-xs font-black text-ash"><Upload aria-hidden="true" size={16} /><span className="truncate">{file?.name ?? "Выбрать .zip"}</span><input accept=".zip,application/zip" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} type="file" /></span></label><button className="student-pressable min-h-11 rounded-brand border-2 border-ecto-dark bg-ecto px-4 text-sm font-black text-white disabled:opacity-50" disabled={!title.trim() || !file || mutation.isPending} onClick={() => mutation.mutate()} type="button">{mutation.isPending ? "Проверка…" : "Загрузить"}</button></div> : null}
    </section>
  );
}
