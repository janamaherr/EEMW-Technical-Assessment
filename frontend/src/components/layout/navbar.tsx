"use client";

import { FileText, LogOut, Search, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser, useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { departmentLabel, roleLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Search", icon: Search },
  { href: "/upload", label: "Upload", icon: Upload },
] as const;

export function Navbar() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-navy text-navy-foreground shadow-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold whitespace-nowrap">
          <FileText className="size-5" />
          <span className="hidden sm:inline">Document Repository</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-white/15" : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right leading-tight md:block">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-white/70">
              {roleLabel(user.role)} · {departmentLabel(user)}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
