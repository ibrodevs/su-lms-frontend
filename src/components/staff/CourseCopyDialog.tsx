import { Copy, X } from "lucide-react";
import { useState } from "react";
import type { CourseCopyPayload } from "../../api/courses.api";

interface CourseCopyDialogProps {
  error?: string;
  initialCode: string;
  initialTitle: string;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (payload: CourseCopyPayload) => void;
  submitLabel: string;
  title: string;
}

const inputClasses = "min-h-12 w-full rounded-brand border-2 border-line bg-paper px-3 text-sm font-bold text-graphite outline-none focus:border-macaw";

export default function CourseCopyDialog({ error, initialCode, initialTitle, isPending, onClose, onSubmit, submitLabel, title }: CourseCopyDialogProps) {
  const [courseTitle, setCourseTitle] = useState(initialTitle);
  const [code, setCode] = useState(initialCode);
  const normalizedCode = code.trim().toUpperCase();
  const isInvalid = !courseTitle.trim() || !normalizedCode;

  return (
    <div aria-labelledby="course-copy-dialog-title" aria-modal="true" className="fixed inset-0 z-[115] grid place-items-center bg-midnight/75 p-4" role="dialog">
      <form className="w-full max-w-lg rounded-brand border-2 border-line bg-paper" onSubmit={(event) => { event.preventDefault(); if (!isInvalid) onSubmit({ title: courseTitle.trim(), code: normalizedCode }); }}>
        <header className="flex items-start justify-between gap-4 border-b-2 border-line p-5">
          <div><span className="text-[10px] font-black uppercase tracking-[0.14em] text-ecto-dark">Course Copy</span><h2 className="mt-1 text-xl font-black text-navy" id="course-copy-dialog-title">{title}</h2></div>
          <button aria-label="Закрыть" className="grid size-10 place-items-center rounded-brand border-2 border-line text-ash hover:bg-mist" disabled={isPending} onClick={onClose} type="button"><X aria-hidden="true" size={18} /></button>
        </header>
        <div className="grid gap-5 p-5">
          <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-wider text-ash">Название курса <span className="text-danger">*</span></span><input autoFocus className={inputClasses} maxLength={255} onChange={(event) => setCourseTitle(event.target.value)} value={courseTitle} /></label>
          <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-wider text-ash">Код курса <span className="text-danger">*</span></span><input className={inputClasses} maxLength={50} onChange={(event) => setCode(event.target.value.toUpperCase())} value={code} /></label>
          {error ? <p className="rounded-brand border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{error}</p> : null}
        </div>
        <footer className="flex gap-3 border-t-2 border-line p-4 sm:justify-end"><button className="min-h-11 flex-1 rounded-brand border-2 border-line px-5 text-sm font-black text-graphite hover:bg-mist sm:flex-none" disabled={isPending} onClick={onClose} type="button">Отмена</button><button className="student-pressable inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white disabled:opacity-50 sm:flex-none" disabled={isInvalid || isPending} type="submit"><Copy aria-hidden="true" size={17} />{isPending ? "Создание…" : submitLabel}</button></footer>
      </form>
    </div>
  );
}
