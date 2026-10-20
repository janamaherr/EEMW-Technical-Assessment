import type { SearchSort } from "@/types/api";

/** Search state as stored in the URL (`/?q=&tags=a,b&uploaderId=&mine=true&sort=title&page=2`). */
export interface SearchState {
  q: string;
  tags: string[];
  uploaderId: string;
  mine: boolean;
  sort: SearchSort;
  page: number;
}

export const DEFAULT_SEARCH: SearchState = {
  q: "",
  tags: [],
  uploaderId: "",
  mine: false,
  sort: "newest",
  page: 1,
};

export function parseSearchState(params: URLSearchParams): SearchState {
  const page = Number.parseInt(params.get("page") ?? "1", 10);
  return {
    q: params.get("q") ?? "",
    tags: (params.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
    uploaderId: params.get("uploaderId") ?? "",
    mine: params.get("mine") === "true",
    sort: params.get("sort") === "title" ? "title" : "newest",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Serializes only non-default values, so URLs stay short and readable. */
export function toQueryString(state: SearchState): string {
  const params = new URLSearchParams();
  if (state.q.trim()) params.set("q", state.q.trim());
  if (state.tags.length) params.set("tags", state.tags.join(","));
  if (state.uploaderId) params.set("uploaderId", state.uploaderId);
  if (state.mine) params.set("mine", "true");
  if (state.sort !== "newest") params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function hasActiveFilters(state: SearchState): boolean {
  return Boolean(state.q || state.tags.length || state.uploaderId || state.mine);
}
