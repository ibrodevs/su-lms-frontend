import { Link } from "react-router-dom";

export default function Logo({ compact = false, to = "/login" }) {
  return (
    <Link className={`su-logo${compact ? " su-logo--compact" : ""}`} to={to} aria-label="SU LMS">
      <span className="su-logo__mark" aria-hidden="true">
        SU
      </span>
      <span className="su-logo__copy">
        <strong>SU LMS</strong>
        {!compact && <small>Learning Management System</small>}
      </span>
    </Link>
  );
}
