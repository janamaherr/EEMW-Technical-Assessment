"use client";

import { Globe, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError, FormAlert } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useApiQuery } from "@/hooks/use-api-query";
import { ApiError } from "@/lib/api/client";
import { getDepartments, getTags, uploadDocument } from "@/lib/api/endpoints";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { validateFile } from "@/lib/files";
import { cn } from "@/lib/utils";
import type { Visibility } from "@/types/api";
import { DepartmentCheckboxes } from "./department-checkboxes";
import { FileField } from "./file-field";
import { TagInput } from "./tag-input";

type Field =
  | "file"
  | "title"
  | "description"
  | "tags"
  | "allowedDepartmentIds"
  | "ownerDepartmentId";
type Errors = Partial<Record<Field, string>>;

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 2000;

export function UploadForm() {
  const uid = useId();
  const user = useCurrentUser();
  const isAdmin = user.role === "ADMIN";
  const router = useRouter();
  const departments = useApiQuery("departments", () => getDepartments());
  const tagOptions = useApiQuery("tags", () => getTags());

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [allowedDepartmentIds, setAllowedDepartmentIds] = useState<string[]>([]);
  const [managersOnly, setManagersOnly] = useState(false);
  const [ownerDepartmentId, setOwnerDepartmentId] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setFile(null);
    setTitle("");
    setDescription("");
    setTags([]);
    setVisibility("PUBLIC");
    setAllowedDepartmentIds([]);
    setManagersOnly(false);
    setOwnerDepartmentId("");
    setErrors({});
    setFormError(null);
    setSubmitting(false);
  }

  function validate(): Errors {
    const e: Errors = {};
    const fileError = validateFile(file);
    if (fileError) e.file = fileError;
    if (!title.trim()) e.title = "Title is required.";
    else if (title.trim().length > TITLE_MAX) e.title = `Title must be at most ${TITLE_MAX} characters.`;
    if (description.length > DESCRIPTION_MAX) {
      e.description = `Description must be at most ${DESCRIPTION_MAX} characters.`;
    }
    if (visibility === "RESTRICTED" && allowedDepartmentIds.length === 0) {
      e.allowedDepartmentIds = "Select at least one department for a restricted document.";
    }
    if (isAdmin && !ownerDepartmentId) e.ownerDepartmentId = "Choose the owner department.";
    return e;
  }

  function handleFileChange(next: File | null) {
    setFile(next);
    // Validate immediately so a wrong type/size is reported before submitting.
    setErrors((prev) => ({ ...prev, file: next ? (validateFile(next) ?? undefined) : undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clientErrors = validate();
    setErrors(clientErrors);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    const form = new FormData();
    form.append("file", file!);
    form.append("title", title.trim());
    if (description.trim()) form.append("description", description.trim());
    if (tags.length) form.append("tags", JSON.stringify(tags));
    form.append("visibility", visibility);
    if (visibility === "RESTRICTED") {
      form.append("allowedDepartmentIds", JSON.stringify(allowedDepartmentIds));
    }
    form.append("minRole", managersOnly ? "MANAGER" : "EMPLOYEE");
    if (isAdmin) form.append("ownerDepartmentId", ownerDepartmentId);

    setSubmitting(true);
    try {
      const document = await uploadDocument(form);
      toast.success(`"${document.title}" uploaded`);
      resetForm(); // Next keeps this page mounted (hidden); start fresh next time
      router.push(`/documents/${document.id}`);
    } catch (err) {
      const apiFieldErrors = fieldErrors(err) as Errors;
      // File problems (413 too large, 415 wrong type) belong next to the file input.
      if (err instanceof ApiError && (err.status === 413 || err.status === 415)) {
        apiFieldErrors.file = err.message;
      }
      setErrors(apiFieldErrors);
      const message = errorMessage(err, "Upload failed.");
      setFormError(message);
      toast.error(message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card className="py-0">
        <CardContent className="space-y-6 p-5 sm:p-6">
          <FormAlert message={formError} />

          <Section label="File" required>
            <FileField file={file} onChange={handleFileChange} error={errors.file} disabled={submitting} />
          </Section>

          <Section label="Title" htmlFor={`${uid}-title`} required>
            <Input
              id={`${uid}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX}
              aria-invalid={!!errors.title}
              disabled={submitting}
              placeholder="e.g. Travel Expense Policy"
            />
            <FieldError message={errors.title} />
          </Section>

          <Section label="Description" htmlFor={`${uid}-description`} hint="Optional">
            <Textarea
              id={`${uid}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={DESCRIPTION_MAX}
              rows={3}
              aria-invalid={!!errors.description}
              disabled={submitting}
              placeholder="What is this document about?"
            />
            <FieldError message={errors.description} />
          </Section>

          <Section label="Tags" hint="Optional">
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={tagOptions.data ?? []}
              disabled={submitting}
              invalid={!!errors.tags}
            />
            <FieldError message={errors.tags} />
          </Section>

          {isAdmin && (
            <Section label="Owner department" htmlFor={`${uid}-owner`} required>
              <Select value={ownerDepartmentId} onValueChange={setOwnerDepartmentId} disabled={submitting}>
                <SelectTrigger id={`${uid}-owner`} className="w-full sm:w-72" aria-invalid={!!errors.ownerDepartmentId}>
                  <SelectValue placeholder="Select the owning department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.data?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.ownerDepartmentId} />
            </Section>
          )}

          <Section label="Visibility" required>
            <div role="radiogroup" aria-label="Visibility" className="grid gap-2 sm:grid-cols-2">
              <VisibilityOption
                selected={visibility === "PUBLIC"}
                onSelect={() => setVisibility("PUBLIC")}
                icon={Globe}
                title="Public"
                description="Every department can see it."
                disabled={submitting}
              />
              <VisibilityOption
                selected={visibility === "RESTRICTED"}
                onSelect={() => setVisibility("RESTRICTED")}
                icon={Lock}
                title="Restricted"
                description="Only selected departments (plus the owner)."
                disabled={submitting}
              />
            </div>
            {visibility === "RESTRICTED" && (
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium">Allowed departments</p>
                <DepartmentCheckboxes
                  departments={departments.data ?? []}
                  selected={allowedDepartmentIds}
                  onChange={setAllowedDepartmentIds}
                  disabled={submitting}
                />
                <FieldError message={errors.allowedDepartmentIds} />
              </div>
            )}
          </Section>

          <div className="flex items-start justify-between gap-4 rounded-lg border px-4 py-3">
            <div>
              <Label htmlFor={`${uid}-managers-only`} className="cursor-pointer">
                Managers only
              </Label>
              <p className="text-sm text-muted-foreground">
                Only managers (and admins) can view this document.
              </p>
            </div>
            <Switch
              id={`${uid}-managers-only`}
              checked={managersOnly}
              onCheckedChange={setManagersOnly}
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Uploading…" : "Upload document"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function Section({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive">*</span>}
        {hint && <span className="font-normal text-muted-foreground">({hint})</span>}
      </Label>
      {children}
    </div>
  );
}

function VisibilityOption({
  selected,
  onSelect,
  icon: Icon,
  title,
  description,
  disabled,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:opacity-50",
        selected ? "border-navy bg-accent ring-1 ring-navy" : "hover:bg-muted/50",
      )}
    >
      <Icon className={cn("mt-0.5 size-4", selected ? "text-navy" : "text-muted-foreground")} />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-sm text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}
