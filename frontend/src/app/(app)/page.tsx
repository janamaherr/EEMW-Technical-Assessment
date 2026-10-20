import { Suspense } from "react";
import { DocumentCardSkeleton } from "@/components/documents/document-card";
import { SearchView } from "@/components/documents/search-view";

export default function SearchPage() {
  // SearchView reads the URL query (useSearchParams), so it renders on the client inside
  // a Suspense boundary; the skeleton is the prerendered fallback.
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <DocumentCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <SearchView />
    </Suspense>
  );
}
