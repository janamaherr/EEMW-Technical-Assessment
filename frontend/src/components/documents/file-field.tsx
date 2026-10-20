"use client";

import { FileUp, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/form-message";
import { FILE_ACCEPT, MAX_FILE_SIZE_MB, formatBytes } from "@/lib/files";
import { cn } from "@/lib/utils";

/** File picker with drag & drop. Validation is done by the parent (see validateFile). */
export function FileField({
  file,
  onChange,
  error,
  disabled,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function pick(files: FileList | null) {
    onChange(files?.[0] ?? null);
  }

  function clear() {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {file ? (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-3",
            error ? "border-destructive/50 bg-destructive/5" : "bg-muted/40",
          )}
        >
          <FileUp className="size-5 shrink-0 text-navy" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clear}
            disabled={disabled}
            aria-label="Remove file"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled) pick(e.dataTransfer.files);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
            dragging ? "border-navy bg-accent" : "hover:border-navy/50 hover:bg-muted/40",
            error && "border-destructive/50",
          )}
        >
          <FileUp className="mb-1 size-7 text-muted-foreground" />
          <span className="text-sm font-medium">Click to choose a file or drag it here</span>
          <span className="text-xs text-muted-foreground">
            PDF, DOCX, XLSX, TXT, PNG, JPG · up to {MAX_FILE_SIZE_MB} MB
          </span>
        </label>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={FILE_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = ""; // allow re-selecting the same file
        }}
        disabled={disabled}
        aria-label="File"
        data-testid="file-input"
      />
      <FieldError message={error} />
    </div>
  );
}
