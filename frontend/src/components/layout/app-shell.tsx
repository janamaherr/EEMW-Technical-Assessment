"use client";

import { Fragment } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { RequireAuth } from "@/components/auth/route-guards";
import { Navbar } from "./navbar";

/** Frame for every protected page: auth check, navbar and a centered content column. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <RequireAuth>
      {/* Keyed by user: Next keeps visited pages mounted, and one user's page state
          (search results, form drafts) must never be shown to the next user. */}
      <Fragment key={user?.id}>
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
      </Fragment>
    </RequireAuth>
  );
}
