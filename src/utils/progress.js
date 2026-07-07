const keyFor = (lessonId) => `lesson-progress-${lessonId}`;

export function getLessonProgress(lessonId) {
  try {
    const raw = localStorage.getItem(keyFor(lessonId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function markLessonStarted(lessonId) {
  const previous = getLessonProgress(lessonId);
  if (previous) return previous;
  const progress = {
    lessonId,
    status: "in-progress",
    bestScore: 0,
    completedAt: null,
  };
  localStorage.setItem(keyFor(lessonId), JSON.stringify(progress));
  return progress;
}

export function saveLessonResult(lesson, score) {
  const previous = getLessonProgress(lesson.id);
  const bestScore = Math.max(previous?.bestScore || 0, score);
  const status = bestScore >= lesson.passingScore ? "completed" : "failed";
  const progress = {
    lessonId: lesson.id,
    status,
    bestScore,
    lastScore: score,
    completedAt: status === "completed" ? new Date().toISOString() : previous?.completedAt || null,
  };
  localStorage.setItem(keyFor(lesson.id), JSON.stringify(progress));
  window.dispatchEvent(new Event("bilim-progress-updated"));
  return progress;
}

export function getStatusLabel(progress) {
  if (!progress) return "Не начато";
  if (progress.status === "completed") return "Сдано";
  if (progress.status === "failed") return "Не сдано";
  return "В процессе";
}

export function getSubjectProgress(lessons) {
  const completed = lessons.filter((lesson) => getLessonProgress(lesson.id)?.status === "completed").length;
  return {
    completed,
    total: lessons.length,
    percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
  };
}
