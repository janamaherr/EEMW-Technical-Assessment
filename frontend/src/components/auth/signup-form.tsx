"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useId } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { useApiQuery } from "@/hooks/use-api-query";
import { getDepartments } from "@/lib/api/endpoints";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useAuth } from "./auth-provider";

type SignupRole = "EMPLOYEE" | "MANAGER";
type Errors = Partial<Record<"name" | "email" | "password" | "departmentId" | "role", string>>;

function validate(values: {
  name: string;
  email: string;
  password: string;
  departmentId: string;
}): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = "Name is required.";
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (values.password.length < 6) errors.password = "Password must be at least 6 characters.";
  if (!values.departmentId) errors.departmentId = "Choose your department.";
  return errors;
}

export function SignupForm() {
  const uid = useId();
  const { signup } = useAuth();
  const router = useRouter();
  const departments = useApiQuery("departments", () => getDepartments());

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [role, setRole] = useState<SignupRole>("EMPLOYEE");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clientErrors = validate({ name, email, password, departmentId });
    setErrors(clientErrors);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      await signup({ name: name.trim(), email: email.trim(), password, departmentId, role });
      toast.success("Welcome! Your account has been created.");
      // Next keeps visited pages mounted (hidden), so clear the form for the next visit.
      setName("");
      setEmail("");
      setPassword("");
      setDepartmentId("");
      setRole("EMPLOYEE");
      setSubmitting(false);
      router.replace("/");
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err, "Sign up failed."));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormAlert message={formError} />

      <div className="space-y-2">
        <Label htmlFor={`${uid}-name`}>Full name</Label>
        <Input
          id={`${uid}-name`}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name}
          autoFocus
        />
        <FieldError message={errors.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${uid}-email`}>Email</Label>
        <Input
          id={`${uid}-email`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          placeholder="you@company.com"
        />
        <FieldError message={errors.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${uid}-password`}>Password</Label>
        <Input
          id={`${uid}-password`}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!errors.password}
        />
        <FieldError message={errors.password ?? undefined} />
        {!errors.password && <p className="text-xs text-muted-foreground">At least 6 characters.</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${uid}-department`}>Department</Label>
          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger id={`${uid}-department`} className="w-full" aria-invalid={!!errors.departmentId}>
              <SelectValue placeholder={departments.loading ? "Loading…" : "Select department"} />
            </SelectTrigger>
            <SelectContent>
              {departments.data?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.departmentId} />
          {departments.error ? (
            <FieldError message="Could not load departments. Is the backend running?" />
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${uid}-role`}>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as SignupRole)}>
            <SelectTrigger id={`${uid}-role`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
            </SelectContent>
          </Select>
          <FieldError message={errors.role} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-navy underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
