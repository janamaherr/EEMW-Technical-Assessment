"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/errors";
import { useAuth } from "./auth-provider";

export function LoginForm() {
  const uid = useId();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      // Next keeps visited pages mounted (hidden), so clear the form for the next visit.
      setEmail("");
      setPassword("");
      setSubmitting(false);
      router.replace("/");
    } catch (err) {
      setError(errorMessage(err, "Login failed."));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormAlert message={error} />
      <div className="space-y-2">
        <Label htmlFor={`${uid}-email`}>Email</Label>
        <Input
          id={`${uid}-email`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${uid}-password`}>Password</Label>
        <Input
          id={`${uid}-password`}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Logging in…" : "Log in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-navy underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
