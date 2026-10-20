"use client";

import { X } from "lucide-react";
import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiQuery } from "@/hooks/use-api-query";
import { getTags, getUsers } from "@/lib/api/endpoints";
import type { SearchState } from "@/lib/search-params";
import type { SearchSort } from "@/types/api";
import { TagMultiSelect } from "./tag-multi-select";

const ALL_UPLOADERS = "all";

export function SearchFilters({
  state,
  onChange,
  onClear,
  canClear,
}: {
  state: SearchState;
  onChange: (patch: Partial<SearchState>) => void;
  onClear: () => void;
  canClear: boolean;
}) {
  const uid = useId();
  const tags = useApiQuery("tags", () => getTags());
  const users = useApiQuery("users", () => getUsers());

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_180px]">
        <TagMultiSelect
          options={tags.data ?? []}
          selected={state.tags}
          onChange={(selected) => onChange({ tags: selected })}
          loading={tags.loading}
        />

        <Select
          value={state.uploaderId || ALL_UPLOADERS}
          onValueChange={(v) => onChange({ uploaderId: v === ALL_UPLOADERS ? "" : v })}
          disabled={state.mine}
        >
          <SelectTrigger className="w-full" aria-label="Filter by uploader">
            <SelectValue placeholder="All uploaders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_UPLOADERS}>All uploaders</SelectItem>
            {users.data?.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
                <span className="text-muted-foreground">· {u.departmentName ?? "Global"}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex h-9 items-center gap-2 px-1">
          <Checkbox
            id={`${uid}-mine`}
            checked={state.mine}
            onCheckedChange={(checked) => onChange({ mine: checked === true })}
          />
          <Label htmlFor={`${uid}-mine`} className="cursor-pointer whitespace-nowrap">
            My documents
          </Label>
        </div>

        <Select value={state.sort} onValueChange={(v) => onChange({ sort: v as SearchSort })}>
          <SelectTrigger className="w-full" aria-label="Sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="title">Title A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(state.tags.length > 0 || canClear) && (
        <div className="flex flex-wrap items-center gap-2">
          {state.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => onChange({ tags: state.tags.filter((t) => t !== tag) })}
                className="rounded-sm p-0.5 hover:bg-black/10"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {canClear && (
            <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-muted-foreground">
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
