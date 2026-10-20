import { FileText } from "lucide-react";
import { RedirectIfAuthenticated } from "@/components/auth/route-guards";

/** Centered card layout for /login and /signup (logged-in users are sent to /). */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-navy text-navy-foreground">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 font-semibold">
          <FileText className="size-5" />
          Document Repository
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center">
        <RedirectIfAuthenticated>{children}</RedirectIfAuthenticated>
      </main>
    </div>
  );
}
