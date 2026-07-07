import { PlayCircle } from "lucide-react";

export default function VideoPlayer({ lesson }) {
  if (!lesson.youtubeEmbedUrl) {
    return (
      <section className="panel empty-state">
        <PlayCircle size={28} />
        <p>Видео для этого урока пока не добавлено.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <span className="feature-badge"><PlayCircle size={16} /> Видео урок</span>
        <a href={lesson.youtubeUrl} target="_blank" rel="noreferrer">Открыть на YouTube</a>
      </div>
      <div className="video-wrapper">
        <iframe
          src={lesson.youtubeEmbedUrl}
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </section>
  );
}
