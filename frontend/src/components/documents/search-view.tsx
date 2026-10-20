"use client";

import { Search, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { useApiQuery } from "@/hooks/use-api-query";
import { searchDocuments } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/errors";
import {
  DEFAULT_SEARCH,
  hasActiveFilters,
  parseSearchState,
  type SearchState,
  toQueryString,
} from "@/lib/search-params";
import { DocumentCard, DocumentCardSkeleton } from "./document-card";
import { EmptyState } from "./empty-state";
import { Pagination } from "./pagination";
import { SearchFilters } from "./search-filters";

const DEBOUNCE_MS = 300;

/** Search page. All search state lives in the URL, so refresh and back/forward keep it. */
export function SearchView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const state = parseSearchState(searchParams);
  const queryString = toQueryString(state);

  function navigate(next: SearchState, mode: "push" | "replace") {
    const url = `${pathname}${toQueryString(next)}`;
    if (mode === "push") router.push(url, { scroll: false });
    else router.replace(url, { scroll: false });
  }

  /** Filter changes reset to page 1 and create a history entry. */
  function updateFilters(patch: Partial<SearchState>) {
    navigate({ ...state, ...patch, page: 1 }, "push");
  }

  // --- debounced title search ------------------------------------------------
  // `query` is the input's live value. `syncedQ` is the last q we wrote to (or read from)
  // the URL; if the URL's q differs from it, the change came from elsewhere (back/forward,
  // "Clear filters"), so the input follows the URL.
  const [query, setQuery] = useState(state.q);
  const [syncedQ, setSyncedQ] = useState(state.q);
  if (state.q !== syncedQ) {
    setSyncedQ(state.q);
    setQuery(state.q);
  }

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const q = value.trim();
      setSyncedQ(q);
      // Typing replaces the history entry so Back doesn't step through every keystroke.
      navigate({ ...parseSearchState(new URLSearchParams(window.location.search)), q, page: 1 }, "replace");
    }, DEBOUNCE_MS);
  }

  function clearAll() {
    clearTimeout(debounceTimer.current);
    setQuery("");
    setSyncedQ("");
    navigate(DEFAULT_SEARCH, "push");
  }

  // --- results ---------------------------------------------------------------
  const results = useApiQuery(`search${queryString}`, (signal) =>
    searchDocuments(
      {
        q: state.q || undefined,
        tags: state.tags,
        uploaderId: state.mine ? undefined : state.uploaderId || undefined,
        mine: state.mine,
        sort: state.sort,
        page: state.page,
      },
      signal,
    ),
  );

  const data = results.data;
  const filtersActive = hasActiveFilters(state);

  return (
    <>
      <PageHeader
        title="Documents"
        description="Search policies, reports and technical documents you have access to."
        actions={
          <Button asChild>
            <Link href="/upload">
              <Upload className="size-4" />
              Upload
            </Link>
          </Button>
        }
      />

      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by title…"
            aria-label="Search by title"
            className="h-11 pl-9 text-base"
          />
        </div>
        <SearchFilters
          state={state}
          onChange={updateFilters}
          onClear={clearAll}
          canClear={filtersActive || state.sort !== "newest"}
        />
      </div>

      {results.error ? (
        <FormAlert message={errorMessage(results.error, "Could not load documents.")} />
      ) : results.loading || !data ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <DocumentCardSkeleton key={i} />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState
          title="No documents found"
          description={
            filtersActive
              ? "Try a different title or remove some filters."
              : "Nothing has been uploaded that you can access yet."
          }
          action={
            filtersActive ? (
              <Button variant="outline" onClick={clearAll}>
                Clear filters
              </Button>
            ) : (
              <Button asChild>
                <Link href="/upload">Upload a document</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {data.total} document{data.total === 1 ? "" : "s"}
          </p>
          {data.items.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={(page) => {
              navigate({ ...state, page }, "push");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </>
  );
}
