import { FileSearch } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = FileSearch,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
      <Icon className="mb-3 size-10 text-muted-foreground/60" />
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
