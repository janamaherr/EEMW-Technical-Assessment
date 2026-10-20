"use client";

import { FilePlus2, Loader2 } from "lucide-react";
import { useState, useId } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldError, FormAlert } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { uploadVersion } from "@/lib/api/endpoints";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { validateFile } from "@/lib/files";
import { FileField } from "./file-field";

const CHANGE_NOTE_MAX = 500;

export function NewVersionDialog({
  documentId,
  onUploaded,
}: {
  documentId: string;
  onUploaded: () => void;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState("");
  const [fileError, setFileError] = useState<string | undefined>();
  const [noteError, setNoteError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setFile(null);
    setChangeNote("");
    setFileError(undefined);
    setNoteError(undefined);
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateFile(file);
    setFileError(error ?? undefined);
    setFormError(null);
    if (error) return;

    const form = new FormData();
    form.append("file", file!);
    if (changeNote.trim()) form.append("changeNote", changeNote.trim());

    setSubmitting(true);
    try {
      const version = await uploadVersion(documentId, form);
      toast.success(`Version ${version.versionNumber} uploaded`);
      setOpen(false);
      reset();
      onUploaded();
    } catch (err) {
      if (err instanceof ApiError && (err.status === 413 || err.status === 415)) {
        setFileError(err.message);
      }
      setNoteError(fieldErrors(err).changeNote);
      setFormError(errorMessage(err, "Upload failed."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (submitting) return; // keep the dialog open while uploading
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <FilePlus2 className="size-4" />
          Upload new version
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Upload a new version</DialogTitle>
            <DialogDescription>
              The new file becomes the current version. Previous versions stay in the history.
            </DialogDescription>
          </DialogHeader>

          <FormAlert message={formError} />

          <FileField
            file={file}
            onChange={(next) => {
              setFile(next);
              setFileError(next ? (validateFile(next) ?? undefined) : undefined);
            }}
            error={fileError}
            disabled={submitting}
          />

          <div className="space-y-2">
            <Label htmlFor={`${uid}-change-note`}>
              Change note <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id={`${uid}-change-note`}
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              maxLength={CHANGE_NOTE_MAX}
              rows={3}
              placeholder="What changed in this version?"
              disabled={submitting}
            />
            <FieldError message={noteError} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Uploading…" : "Upload version"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
