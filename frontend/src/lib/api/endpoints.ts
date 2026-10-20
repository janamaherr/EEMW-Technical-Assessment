// Typed wrappers for every backend endpoint the UI uses.
import type {
  AuthResponse,
  Department,
  DocumentDetail,
  DocumentVersion,
  SearchParams,
  SearchResponse,
  User,
  UserOption,
} from "@/types/api";
import { apiFetch, apiFetchBlob } from "./client";

// --- auth -------------------------------------------------------------------

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    json: { email, password },
    auth: false,
  });
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  departmentId: string;
  role: "EMPLOYEE" | "MANAGER";
}

export function signup(input: SignupInput) {
  return apiFetch<AuthResponse>("/auth/signup", { method: "POST", json: input, auth: false });
}

export function getMe() {
  return apiFetch<{ user: User }>("/auth/me").then((r) => r.user);
}

// --- lookups ----------------------------------------------------------------

export function getDepartments() {
  return apiFetch<{ departments: Department[] }>("/departments", { auth: false }).then(
    (r) => r.departments,
  );
}

export function getUsers() {
  return apiFetch<{ users: UserOption[] }>("/users").then((r) => r.users);
}

export function getTags() {
  return apiFetch<{ tags: string[] }>("/tags").then((r) => r.tags);
}

// --- documents --------------------------------------------------------------

export const SEARCH_PAGE_SIZE = 10;

export function searchDocuments(params: SearchParams, signal?: AbortSignal) {
  return apiFetch<SearchResponse>("/documents", {
    query: {
      q: params.q,
      tags: params.tags?.length ? params.tags.join(",") : undefined,
      uploaderId: params.uploaderId,
      mine: params.mine ? "true" : undefined,
      sort: params.sort,
      page: params.page,
      pageSize: SEARCH_PAGE_SIZE,
    },
    signal,
  });
}

export function getDocument(id: string) {
  return apiFetch<{ document: DocumentDetail }>(`/documents/${id}`).then((r) => r.document);
}

export function getVersions(id: string) {
  return apiFetch<{ versions: DocumentVersion[] }>(`/documents/${id}/versions`).then(
    (r) => r.versions,
  );
}

export function uploadDocument(formData: FormData) {
  return apiFetch<{ document: DocumentDetail }>("/documents", { method: "POST", formData }).then(
    (r) => r.document,
  );
}

export function uploadVersion(id: string, formData: FormData) {
  return apiFetch<{ version: DocumentVersion }>(`/documents/${id}/versions`, {
    method: "POST",
    formData,
  }).then((r) => r.version);
}

export function deleteDocument(id: string) {
  return apiFetch<void>(`/documents/${id}`, { method: "DELETE" });
}

/** Fetches a version's file (current version when versionId is omitted) as a Blob. */
export function fetchDocumentFile(
  documentId: string,
  options: { versionId?: string; disposition?: "inline" | "attachment" } = {},
) {
  const path = options.versionId
    ? `/documents/${documentId}/versions/${options.versionId}/file`
    : `/documents/${documentId}/file`;
  return apiFetchBlob(path, { query: { disposition: options.disposition ?? "attachment" } });
}
