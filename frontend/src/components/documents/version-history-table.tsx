"use client";

import { Download, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fileTypeLabel, formatBytes } from "@/lib/files";
import { formatDateTime } from "@/lib/format";
import type { DocumentVersion } from "@/types/api";

export function VersionHistoryTable({
  versions,
  onDownload,
  isDownloading,
}: {
  versions: DocumentVersion[];
  onDownload: (version: DocumentVersion) => void;
  isDownloading: (versionId: string) => boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-20">Version</TableHead>
            <TableHead>File</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Size</TableHead>
            <TableHead>Uploaded by</TableHead>
            <TableHead>Change note</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Download</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions.map((v) => (
            <TableRow key={v.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">v{v.versionNumber}</span>
                  {v.isCurrent && <Badge className="bg-navy text-white">Current</Badge>}
                </div>
              </TableCell>
              <TableCell className="max-w-48 truncate" title={v.originalFilename}>
                {v.originalFilename}
              </TableCell>
              <TableCell>{fileTypeLabel(v.mimeType)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatBytes(v.sizeBytes)}</TableCell>
              <TableCell>{v.uploadedBy.name}</TableCell>
              <TableCell className="max-w-64 min-w-48 whitespace-normal text-muted-foreground">
                {v.changeNote ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatDateTime(v.createdAt)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDownload(v)}
                  disabled={isDownloading(v.id)}
                  aria-label={`Download version ${v.versionNumber}`}
                >
                  {isDownloading(v.id) ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
