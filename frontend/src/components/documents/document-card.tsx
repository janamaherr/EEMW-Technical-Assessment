import { Building2, CalendarDays, Layers, User } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import type { DocumentListItem } from "@/types/api";
import { AccessBadges, TagBadges } from "./access-badges";

export function DocumentCard({ document }: { document: DocumentListItem }) {
  return (
    <Card className="gap-0 py-0 transition-shadow hover:shadow-md">
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Link
            href={`/documents/${document.id}`}
            className="min-w-0 text-lg font-semibold text-navy break-words underline-offset-4 hover:underline"
          >
            {document.title}
          </Link>
          <div className="flex flex-wrap gap-1.5">
            <AccessBadges visibility={document.visibility} minRole={document.minRole} />
          </div>
        </div>

        {document.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{document.description}</p>
        ) : null}

        <TagBadges tags={document.tags} />

        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <Meta icon={User} label="Uploader" value={document.uploader.name} />
          <Meta icon={Building2} label="Owner department" value={document.ownerDepartment.name} />
          <Meta icon={CalendarDays} label="Created" value={formatDate(document.createdAt)} />
          {document.currentVersion ? (
            <Meta icon={Layers} label="Version" value={`v${document.currentVersion.versionNumber}`} />
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5" title={label}>
      <dt className="sr-only">{label}</dt>
      <Icon className="size-4" />
      <dd>{value}</dd>
    </div>
  );
}

export function DocumentCardSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="space-y-3 p-4 sm:p-5">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}
