import { parseApiError } from "./errors";
import type { ApiResponseType } from "./types";

const FALLBACK_API_BASE_URL = "/api/v1";

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || FALLBACK_API_BASE_URL,
);

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${normalizePath(path)}`;
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | null;
  json?: unknown;
  responseType?: ApiResponseType;
  skipAuthRefresh?: boolean;
}

let refreshRequest: Promise<boolean> | null = null;

function isRefreshAllowed(path: string): boolean {
  const normalizedPath = normalizePath(path);
  return !["/auth/login/", "/auth/logout/", "/auth/refresh/"].includes(normalizedPath);
}

async function refreshSession(): Promise<boolean> {
  if (!refreshRequest) {
    refreshRequest = fetch(getApiUrl("/auth/refresh/"), {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

function createHeaders(options: ApiRequestOptions): Headers {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function readSuccessResponse<T>(
  response: Response,
  responseType: ApiResponseType,
): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  if (responseType === "blob") {
    return await response.blob() as T;
  }

  if (responseType === "text") {
    return await response.text() as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function request<T>(
  path: string,
  options: ApiRequestOptions,
  hasRetriedAfterRefresh: boolean,
): Promise<T> {
  const {
    body,
    json,
    responseType = "json",
    skipAuthRefresh = false,
    ...requestInit
  } = options;
  const response = await fetch(getApiUrl(path), {
    ...requestInit,
    body: json === undefined ? body : JSON.stringify(json),
    credentials: "include",
    headers: createHeaders(options),
  });

  if (
    response.status === 401 &&
    !hasRetriedAfterRefresh &&
    !skipAuthRefresh &&
    isRefreshAllowed(path) &&
    await refreshSession()
  ) {
    return request<T>(path, options, true);
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return readSuccessResponse<T>(response, responseType);
}

export function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  return request<T>(path, options, false);
}

export const apiClient = {
  get<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    return apiRequest<T>(path, { ...options, method: "GET" });
  },

  post<T>(path: string, json?: unknown, options: ApiRequestOptions = {}): Promise<T> {
    return apiRequest<T>(path, { ...options, method: "POST", json });
  },

  patch<T>(path: string, json: unknown, options: ApiRequestOptions = {}): Promise<T> {
    return apiRequest<T>(path, { ...options, method: "PATCH", json });
  },

  delete<T = void>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    return apiRequest<T>(path, { ...options, method: "DELETE" });
  },

  upload<T>(path: string, formData: FormData, options: ApiRequestOptions = {}): Promise<T> {
    return apiRequest<T>(path, { ...options, method: "POST", body: formData });
  },

  download(path: string, options: ApiRequestOptions = {}): Promise<Blob> {
    return apiRequest<Blob>(path, { ...options, method: "GET", responseType: "blob" });
  },
};

