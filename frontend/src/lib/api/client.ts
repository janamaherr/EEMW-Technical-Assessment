import { clearToken, getToken } from "@/lib/auth/token";
import type { ApiErrorBody, FieldIssue } from "@/types/api";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

/** An error response from the API, in the backend's `{ error: { code, message, details } }` shape. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Field-level validation messages, if the API sent any. */
  get fieldIssues(): FieldIssue[] {
    return Array.isArray(this.details)
      ? this.details.filter(
          (d): d is FieldIssue => typeof d === "object" && d !== null && "message" in d,
        )
      : [];
  }
}

/**
 * Called when an authenticated request gets a 401 (expired/invalid token). AuthProvider
 * installs the real handler (clear the session, toast, router.replace("/login")).
 */
let onUnauthorized: () => void = () => {};

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body (sent as application/json). */
  json?: unknown;
  /** Multipart body (the browser sets the boundary header). */
  formData?: FormData;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Send the bearer token (default true). Public endpoints set false. */
  auth?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(API_URL + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    if (body.error) {
      return new ApiError(response.status, body.error.code, body.error.message, body.error.details);
    }
  } catch {
    // Non-JSON error body (e.g. proxy error page).
  }
  return new ApiError(response.status, "HTTP_ERROR", `Request failed (${response.status})`);
}

/** Low-level request: adds auth, handles errors and the global 401 logout. */
async function request(path: string, options: RequestOptions = {}): Promise<Response> {
  const { method = "GET", json, formData, query, auth = true, signal } = options;
  const headers: Record<string, string> = {};
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: formData ?? (json !== undefined ? JSON.stringify(json) : undefined),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "NETWORK_ERROR", "Cannot reach the server. Is the backend running?");
  }

  if (!response.ok) {
    const error = await toApiError(response);
    // A 401 on an authenticated request means the session is gone: log out everywhere.
    // (A 401 from /auth/login itself is just "wrong password" and is not sent with a token.)
    if (response.status === 401 && token) {
      clearToken();
      onUnauthorized();
    }
    throw error;
  }
  return response;
}

/** JSON request. Returns undefined for 204 No Content. */
export async function apiFetch<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await request(path, options);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** File request: returns the body as a Blob plus the filename from Content-Disposition. */
export async function apiFetchBlob(
  path: string,
  options?: RequestOptions,
): Promise<{ blob: Blob; filename: string | null }> {
  const response = await request(path, options);
  return {
    blob: await response.blob(),
    filename: parseContentDispositionFilename(response.headers.get("Content-Disposition")),
  };
}

/** Extracts the filename, preferring the RFC 5987 `filename*=UTF-8''...` form. */
export function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null;
  const extended = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);
  if (extended) {
    try {
      return decodeURIComponent(extended[1].trim());
    } catch {
      // fall through to the plain form
    }
  }
  const plain = /filename\s*=\s*"((?:\\.|[^"\\])*)"|filename\s*=\s*([^;]+)/i.exec(header);
  const value = plain?.[1] ?? plain?.[2];
  return value ? value.replace(/\\(.)/g, "$1").trim() : null;
}
