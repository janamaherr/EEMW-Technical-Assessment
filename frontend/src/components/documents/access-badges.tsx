import { Lock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MinRole, Visibility } from "@/types/api";

/** "Restricted" and "Managers only" markers, shown wherever a document is listed. */
export function AccessBadges({ visibility, minRole }: { visibility: Visibility; minRole: MinRole }) {
  return (
    <>
      {visibility === "RESTRICTED" && (
        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
          <Lock />
          Restricted
        </Badge>
      )}
      {minRole === "MANAGER" && (
        <Badge variant="outline" className="border-violet-300 bg-violet-50 text-violet-800">
          <ShieldCheck />
          Managers only
        </Badge>
      )}
    </>
  );
}

export function TagBadges({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
        </Badge>
      ))}
    </div>
  );
}
