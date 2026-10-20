import { AppShell } from "@/components/layout/app-shell";

/** Every page in this group requires login and shows the navbar. */
export default function ProtectedLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
