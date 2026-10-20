"use client";

import { ArrowLeft, Download, FileX, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/form-message";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { useFileDownload } from "@/hooks/use-file-download";
import { ApiError } from "@/lib/api/client";
import { getDocument, getVersions } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/errors";
import { AccessBadges } from "./access-badges";
import { DeleteDocumentButton } from "./delete-document-button";
import { DocumentMetadata } from "./document-metadata";
import { EmptyState } from "./empty-state";
import { FilePreview } from "./file-preview";
import { NewVersionDialog } from "./new-version-dialog";
import { VersionHistoryTable } from "./version-history-table";

export function DocumentDetailView() {
  const { id } = useParams<{ id: string }>();
  const { download, isPending } = useFileDownload(id);

  const query = useApiQuery(`document:${id}`, async () => {
    const [document, versions] = await Promise.all([getDocument(id), getVersions(id)]);
    return { document, versions };
  });

  // The API answers 404 for unknown, deleted AND not-permitted documents (by design).
  if (query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 400)) {
    return <DocumentNotFound />;
  }
  if (query.error) {
    return <FormAlert message={errorMessage(query.error, "Could not load the document.")} />;
  }
  // Keep showing the current data while it refreshes (e.g. after a new version).
  if (!query.data || query.data.document.id !== id) return <DetailSkeleton />;

  const { document, versions } = query.data;
  const current = document.currentVersion;

  return (
    <>
      <BackLink />
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {document.title}
            <span className="flex gap-1.5">
              <AccessBadges visibility={document.visibility} minRole={document.minRole} />
            </span>
          </span>
        }
        description={document.description ?? undefined}
        actions={
          <>
            {current && (
              <Button
                variant="outline"
                onClick={() => download({ fallbackName: current.originalFilename })}
                disabled={isPending()}
              >
                {isPending() ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                Download
              </Button>
            )}
            {document.canEdit && (
              <>
                <NewVersionDialog documentId={document.id} onUploaded={query.reload} />
                <DeleteDocumentButton documentId={document.id} title={document.title} />
              </>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          <Card className="gap-4">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base text-navy">
                Preview{current ? ` · v${current.versionNumber}` : ""}
              </CardTitle>
              {current && (
                <span className="truncate text-sm text-muted-foreground">
                  {current.originalFilename}
                </span>
              )}
            </CardHeader>
            <CardContent>
              {current ? (
                <FilePreview
                  documentId={document.id}
                  version={current}
                  onDownload={() => download({ fallbackName: current.originalFilename })}
                  downloading={isPending()}
                />
              ) : (
                <p className="text-sm text-muted-foreground">This document has no file yet.</p>
              )}
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              Version history{" "}
              <span className="text-sm font-normal text-muted-foreground">({versions.length})</span>
            </h2>
            <VersionHistoryTable
              versions={versions}
              onDownload={(v) => download({ versionId: v.id, fallbackName: v.originalFilename })}
              isDownloading={isPending}
            />
          </section>
        </div>

        <DocumentMetadata document={document} />
      </div>
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-navy"
    >
      <ArrowLeft className="size-4" />
      Back to search
    </Link>
  );
}

export function DocumentNotFound() {
  return (
    <>
      <BackLink />
      <EmptyState
        icon={FileX}
        title="Document not found"
        description="It may have been deleted, or you don't have permission to view it."
        action={
          <Button asChild>
            <Link href="/">Back to search</Link>
          </Button>
        }
      />
    </>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="mb-4 h-4 w-28" />
      <Skeleton className="mb-2 h-8 w-2/3" />
      <Skeleton className="mb-6 h-4 w-1/2" />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Skeleton className="h-[480px] w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
