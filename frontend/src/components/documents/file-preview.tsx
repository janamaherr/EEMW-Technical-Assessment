"use client";

import { Download, FileQuestion, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-message";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchDocumentFile } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/errors";
import { previewKind } from "@/lib/files";
import type { DocumentVersion } from "@/types/api";

interface PreviewData {
  url: string;
  text?: string;
}

/**
 * Inline preview of a version: PDF in an iframe, images as <img>, text as <pre>. The file is
 * fetched with the Authorization header and shown through a short-lived blob: URL.
 */
export function FilePreview({
  documentId,
  version,
  onDownload,
  downloading,
}: {
  documentId: string;
  version: DocumentVersion;
  onDownload: () => void;
  downloading: boolean;
}) {
  const kind = previewKind(version.mimeType);

  const preview = useApiQuery<PreviewData>(
    kind === "none" ? null : `preview:${documentId}:${version.id}`,
    async () => {
      const { blob } = await fetchDocumentFile(documentId, {
        versionId: version.id,
        disposition: "inline",
      });
      // Re-type the blob so the browser's PDF viewer / image decoder recognises it.
      const typed = new Blob([blob], { type: version.mimeType });
      return {
        url: URL.createObjectURL(typed),
        text: kind === "text" ? await typed.text() : undefined,
      };
    },
  );

  const url = preview.data?.url;
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (kind === "none") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
        <FileQuestion className="size-10 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
        <Button onClick={onDownload} disabled={downloading}>
          {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Download {version.originalFilename}
        </Button>
      </div>
    );
  }

  if (preview.error) {
    return <FormAlert message={errorMessage(preview.error, "Could not load the preview.")} />;
  }

  if (preview.loading || !preview.data) {
    return <Skeleton className="h-[480px] w-full" />;
  }

  if (kind === "pdf") {
    return (
      <iframe
        // Viewer hints: hide the thumbnail sidebar and fit the page to the frame width.
        src={`${preview.data.url}#navpanes=0&view=FitH`}
        title={`Preview of ${version.originalFilename}`}
        className="h-[70vh] min-h-[420px] w-full rounded-lg border"
      />
    );
  }

  if (kind === "image") {
    return (
      <div className="flex justify-center rounded-lg border bg-muted/30 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL, not optimizable */}
        <img
          src={preview.data.url}
          alt={version.originalFilename}
          className="max-h-[70vh] max-w-full object-contain"
        />
      </div>
    );
  }

  return (
    <pre className="max-h-[70vh] overflow-auto rounded-lg border bg-muted/30 p-4 font-mono text-sm whitespace-pre-wrap">
      {preview.data.text}
    </pre>
  );
}
