import ErrorPage from "./ErrorPage";

export default function ForbiddenPage() {
  return (
    <ErrorPage
      code="403"
      description="У вас нет прав для просмотра этой страницы."
      title="Доступ запрещён"
    />
  );
}
