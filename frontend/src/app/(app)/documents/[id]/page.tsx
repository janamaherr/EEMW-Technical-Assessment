import type { Metadata } from "next";
import { Suspense } from "react";
import { DocumentDetailView } from "@/components/documents/document-detail-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Document" };

export default function DocumentPage() {
  // The id is read on the client with useParams (data is fetched in the browser with the
  // user's token), so the view sits inside a Suspense boundary for prerendering.
  return (
    <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
      <DocumentDetailView />
    </Suspense>
  );
}
