import { CircleAlert } from "lucide-react";

export default function FormError({ id, message }) {
  if (!message) {
    return null;
  }

  return (
    <p className="su-field-error" id={id} role="alert">
      <CircleAlert aria-hidden="true" size={15} />
      {message}
    </p>
  );
}
