export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
  status?: number;
}

interface ErrorEnvelope {
  error?: {
    code?: unknown;
    message?: unknown;
    fields?: unknown;
  };
  detail?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeFields(value: unknown): Record<string, string[]> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const fields = Object.entries(value).reduce<Record<string, string[]>>(
    (result, [key, fieldValue]) => {
      if (Array.isArray(fieldValue)) {
        result[key] = fieldValue.map(String);
      } else if (fieldValue !== null && fieldValue !== undefined) {
        result[key] = [String(fieldValue)];
      }
      return result;
    },
    {},
  );

  return Object.keys(fields).length > 0 ? fields : undefined;
}

function getDefaultMessage(status: number): string {
  if (status === 401) return "Требуется авторизация.";
  if (status === 403) return "Недостаточно прав для выполнения действия.";
  if (status === 404) return "Запрошенные данные не найдены.";
  if (status >= 500) return "Сервис временно недоступен.";
  return "Не удалось выполнить запрос.";
}

export class ApiClientError extends Error implements ApiError {
  readonly code: string;
  readonly fields?: Record<string, string[]>;
  readonly status: number;

  constructor({ code, message, fields, status }: ApiError) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.fields = fields;
    this.status = status ?? 0;
  }
}

export async function parseApiError(response: Response): Promise<ApiClientError> {
  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    // Non-JSON failures still become a stable application error.
  }

  const envelope: ErrorEnvelope = isRecord(payload) ? payload : {};
  const backendError = isRecord(envelope.error) ? envelope.error : undefined;
  const fields = normalizeFields(backendError?.fields) ??
    (backendError ? undefined : normalizeFields(payload));
  const code = typeof backendError?.code === "string"
    ? backendError.code
    : response.status === 401
      ? "authentication_failed"
      : response.status === 403
        ? "permission_denied"
        : response.status === 404
          ? "not_found"
          : response.status >= 500
            ? "server_error"
            : "request_failed";
  const message = typeof backendError?.message === "string"
    ? backendError.message
    : typeof envelope.detail === "string"
      ? envelope.detail
      : getDefaultMessage(response.status);

  return new ApiClientError({ code, message, fields, status: response.status });
}

