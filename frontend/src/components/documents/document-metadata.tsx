import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { DocumentDetail } from "@/types/api";
import { TagBadges } from "./access-badges";

export function DocumentMetadata({ document }: { document: DocumentDetail }) {
  return (
    <Card className="gap-4 self-start">
      <CardHeader>
        <CardTitle className="text-base text-navy">Details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3 text-sm">
          <Row label="Uploaded by">{document.uploader.name}</Row>
          <Row label="Owner department">{document.ownerDepartment.name}</Row>
          <Row label="Visibility">
            {document.visibility === "PUBLIC" ? "Public (all departments)" : "Restricted"}
          </Row>
          {document.visibility === "RESTRICTED" && (
            <Row label="Allowed departments">
              {/* The owner department always has access as well. */}
              {[
                document.ownerDepartment.name,
                ...document.allowedDepartments
                  .map((d) => d.name)
                  .filter((name) => name !== document.ownerDepartment.name),
              ].join(", ")}
            </Row>
          )}
          <Row label="Who can view">
            {document.minRole === "MANAGER" ? "Managers and admins only" : "All roles"}
          </Row>
          <Row label="Tags">
            {document.tags.length ? (
              <TagBadges tags={document.tags} />
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </Row>
          <Row label="Created">{formatDateTime(document.createdAt)}</Row>
          <Row label="Last updated">{formatDateTime(document.updatedAt)}</Row>
        </dl>
      </CardContent>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
