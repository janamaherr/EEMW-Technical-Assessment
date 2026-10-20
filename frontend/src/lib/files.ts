// Client-side file rules (mirrors the backend) and blob helpers.

export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_EXTENSIONS = ["pdf", "docx", "xlsx", "txt", "png", "jpg", "jpeg"] as const;

/** Value for <input type="file" accept>. */
export const FILE_ACCEPT = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",");

export function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
}

/** Returns an error message, or null if the file is acceptable. */
export function validateFile(file: File | null | undefined): string | null {
  if (!file) return "Please choose a file.";
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(getExtension(file.name))) {
    return `File type not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is too large (${formatBytes(file.size)}). Maximum is ${MAX_FILE_SIZE_MB} MB.`;
  }
  if (file.size === 0) return "File is empty.";
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

const TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "text/plain": "Text",
  "image/png": "PNG",
  "image/jpeg": "JPEG",
};

export function fileTypeLabel(mimeType: string): string {
  return TYPE_LABELS[mimeType] ?? mimeType;
}

export type PreviewKind = "pdf" | "image" | "text" | "none";

export function previewKind(mimeType: string): PreviewKind {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/png" || mimeType === "image/jpeg") return "image";
  if (mimeType === "text/plain") return "text";
  return "none";
}

/** Saves a Blob to disk under the given filename via a temporary object URL. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
