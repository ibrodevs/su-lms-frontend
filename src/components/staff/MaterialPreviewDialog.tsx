import { Download, ExternalLink, FileArchive, FileText, Headphones, Image, Play, X } from "lucide-react";
import type { StaffMaterial } from "../../types/staff";
import { formatFileSize, getMaterialDomain, staffMaterialTypeLabels } from "../../utils/materialDisplay";

interface MaterialPreviewDialogProps {
  material: StaffMaterial | null;
  onClose: () => void;
}

export default function MaterialPreviewDialog({ material, onClose }: MaterialPreviewDialogProps) {
  if (!material) return null;
  const isExternal = material.type === "external" || material.type === "library";

  return (
    <div aria-labelledby="material-preview-title" aria-modal="true" className="fixed inset-0 z-[115] grid place-items-center bg-midnight/75 p-3 sm:p-6" role="dialog">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-brand border-2 border-line bg-paper">
        <header className="flex items-start justify-between gap-4 border-b-2 border-line p-4 sm:p-5">
          <div className="min-w-0"><span className="text-[10px] font-black uppercase tracking-[0.14em] text-ecto-dark">{staffMaterialTypeLabels[material.type]}</span><h2 className="mt-1 truncate text-xl font-black text-navy" id="material-preview-title">{material.title}</h2><p className="mt-1 text-xs text-ash">{material.fileName ?? getMaterialDomain(material.url)} · {formatFileSize(material.sizeBytes)}</p></div>
          <button aria-label="Закрыть просмотр" className="grid size-10 shrink-0 place-items-center rounded-brand border-2 border-line text-ash hover:bg-mist" onClick={onClose} type="button"><X aria-hidden="true" size={18} /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {material.availability !== "available" ? (
            <PreviewState icon={FileArchive} text={material.availability === "error" ? "Не удалось загрузить материал. Проверьте mock-ссылку или замените файл." : "Материал временно недоступен для просмотра."} title="Предпросмотр недоступен" />
          ) : null}
          {material.availability === "available" && material.type === "pdf" && material.url ? <iframe className="h-[62vh] w-full rounded-brand border-2 border-line bg-mist" src={material.url} title={material.title} /> : null}
          {material.availability === "available" && material.type === "image" && material.url ? <img alt={material.title} className="mx-auto max-h-[62vh] rounded-brand border-2 border-line object-contain" src={material.url} /> : null}
          {material.availability === "available" && material.type === "audio" ? material.url ? <audio className="w-full" controls src={material.url}>Ваш браузер не поддерживает аудио.</audio> : <PreviewState icon={Headphones} text="Mock-файл выбран, аудиоплеер появится после подключения файлового API." title="Аудиоматериал" /> : null}
          {material.availability === "available" && material.type === "video" ? material.url ? <video className="max-h-[62vh] w-full rounded-brand bg-midnight" controls src={material.url}>Ваш браузер не поддерживает видео.</video> : <PreviewState icon={Play} text="Mock-файл выбран, видеоплеер появится после подключения файлового API." title="Видеоматериал" /> : null}
          {material.availability === "available" && (material.type === "docx" || material.type === "pptx") ? <PreviewState icon={FileText} text="Для офисных документов в статичной версии доступна карточка файла. Онлайн-preview подключается вместе с backend storage." title={`Preview ${staffMaterialTypeLabels[material.type]}`} /> : null}
          {material.availability === "available" && material.type === "image" && !material.url ? <PreviewState icon={Image} text="Изображение добавлено как mock-файл. После подключения storage здесь появится preview." title="Изображение" /> : null}
          {material.availability === "available" && material.type === "pdf" && !material.url ? <PreviewState icon={FileText} text="PDF добавлен как mock-файл. Встроенный просмотр появится после подключения storage." title="PDF-документ" /> : null}
          {material.availability === "available" && isExternal ? <div className="grid min-h-80 place-items-center rounded-brand border-2 border-line bg-mist p-6 text-center"><div><ExternalLink aria-hidden="true" className="mx-auto text-macaw-dark" size={42} /><h3 className="mt-4 text-xl font-black text-navy">Переход на внешний ресурс</h3><p className="mt-2 text-sm leading-6 text-ash">{material.description}</p><span className="mt-4 inline-flex rounded-brand border-2 border-line bg-paper px-3 py-2 text-xs font-black text-graphite">{getMaterialDomain(material.url)}</span>{material.url ? <a className="student-pressable mx-auto mt-5 flex min-h-11 w-fit items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white" href={material.url} rel="noreferrer" target="_blank">Открыть ресурс <ExternalLink aria-hidden="true" size={16} /></a> : null}</div></div> : null}
        </div>

        <footer className="flex flex-wrap justify-end gap-3 border-t-2 border-line p-4">
          <button className="min-h-11 rounded-brand border-2 border-line px-5 text-sm font-black text-graphite hover:bg-mist" onClick={onClose} type="button">Закрыть</button>
          {material.downloadAllowed && material.url && !isExternal ? <a className="student-pressable inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-ecto-dark bg-ecto px-5 text-sm font-black text-white" download={material.fileName} href={material.url}><Download aria-hidden="true" size={17} /> Скачать</a> : null}
        </footer>
      </div>
    </div>
  );
}

function PreviewState({ icon: Icon, text, title }: { icon: typeof FileText; text: string; title: string }) {
  return <div className="grid min-h-80 place-items-center rounded-brand border-2 border-dashed border-line bg-mist p-6 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-brand bg-paper text-macaw-dark"><Icon aria-hidden="true" size={30} /></span><h3 className="mt-4 text-xl font-black text-navy">{title}</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ash">{text}</p></div></div>;
}
