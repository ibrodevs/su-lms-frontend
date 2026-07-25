import ErrorPage from "./ErrorPage";

export default function NotFoundPage() {
  return (
    <ErrorPage
      code="404"
      description="Похоже, страница была перемещена, удалена или адрес указан неверно."
      title="Страница не найдена"
    />
  );
}
