import { ArrowLeft, ServerCrash } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import StatePanel from "../../components/student/StatePanel";

interface RouteParams {
  courseId?: string;
}

export default function CourseFormBlockedPage() {
  const { courseId } = useParams<RouteParams>();
  const returnPath = courseId ? `/courses/${courseId}` : "/courses";

  return (
    <StatePanel
      action={(
        <Link className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-brand border-2 border-line px-4 text-sm font-black text-graphite hover:border-lingot" to={returnPath}>
          <ArrowLeft aria-hidden="true" size={17} /> Вернуться к курсам
        </Link>
      )}
      description="Backend пока не предоставляет справочники факультетов, кафедр, программ и семестров. Форма отключена, чтобы не сохранять mock-данные вместо реальных связей."
      icon={ServerCrash}
      kind="error"
      title={courseId ? "Редактирование временно недоступно" : "Создание курса временно недоступно"}
    />
  );
}
