"use client";

import { useState } from "react";
import { toast } from "sonner";
import { fetchDocumentFile } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/errors";
import { saveBlob } from "@/lib/files";

/**
 * Downloads a document file with the Authorization header (no tokens in URLs) and saves it
 * under its original filename. Tracks which version is downloading for button spinners.
 */
export function useFileDownload(documentId: string) {
  const [pending, setPending] = useState<string | null>(null);

  async function download(options: { versionId?: string; fallbackName: string }) {
    const key = options.versionId ?? "current";
    setPending(key);
    try {
      const { blob, filename } = await fetchDocumentFile(documentId, {
        versionId: options.versionId,
        disposition: "attachment",
      });
      saveBlob(blob, filename ?? options.fallbackName);
    } catch (err) {
      toast.error(errorMessage(err, "Download failed."));
    } finally {
      setPending(null);
    }
  }

  return {
    download,
    isPending: (versionId?: string) => pending === (versionId ?? "current"),
  };
}
