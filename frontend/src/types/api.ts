// Types mirroring the backend API responses.

export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";
export type Visibility = "PUBLIC" | "RESTRICTED";
export type MinRole = "EMPLOYEE" | "MANAGER";

export interface Department {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
  createdAt: string;
  department: Department | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserOption {
  id: string;
  name: string;
  departmentName: string | null;
}

export interface PersonRef {
  id: string;
  name: string;
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  changeNote: string | null;
  createdAt: string;
  uploadedBy: PersonRef;
  isCurrent?: boolean;
}

export interface DocumentListItem {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  uploader: PersonRef;
  ownerDepartment: Department;
  visibility: Visibility;
  minRole: MinRole;
  currentVersion: Pick<DocumentVersion, "versionNumber" | "mimeType" | "sizeBytes"> | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDetail {
  id: string;
  title: string;
  description: string | null;
  visibility: Visibility;
  minRole: MinRole;
  ownerDepartment: Department;
  uploader: PersonRef & { email: string };
  tags: string[];
  allowedDepartments: Department[];
  currentVersion: DocumentVersion | null;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
}

export interface SearchResponse {
  items: DocumentListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type SearchSort = "newest" | "title";

export interface SearchParams {
  q?: string;
  tags?: string[];
  uploaderId?: string;
  mine?: boolean;
  sort?: SearchSort;
  page?: number;
}

/** A field-level validation message from the API. */
export interface FieldIssue {
  field?: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
