"use client";

import { X } from "lucide-react";
import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 50;

const normalize = (tag: string) => tag.trim().toLowerCase();

/** Free-form tag chips: type and press Enter (or comma). Suggests existing tags while typing. */
export function TagInput({
  value,
  onChange,
  suggestions,
  disabled,
  invalid,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  disabled?: boolean;
  invalid?: boolean;
}) {
  const listId = useId();
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const full = value.length >= MAX_TAGS;
  const needle = normalize(draft);
  const matches = needle
    ? suggestions.filter((s) => s.includes(needle) && !value.includes(s)).slice(0, 6)
    : [];
  const showSuggestions = focused && matches.length > 0 && !full;

  function add(raw: string) {
    const tag = normalize(raw).slice(0, MAX_TAG_LENGTH);
    setDraft("");
    setHighlight(0);
    if (!tag || value.includes(tag) || full) return;
    onChange([...value, tag]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(showSuggestions && matches[highlight] ? matches[highlight] : draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === "ArrowDown" && showSuggestions) {
      e.preventDefault();
      setHighlight((h) => (h + 1) % matches.length);
    } else if (e.key === "ArrowUp" && showSuggestions) {
      e.preventDefault();
      setHighlight((h) => (h - 1 + matches.length) % matches.length);
    } else if (e.key === "Escape") {
      setDraft("");
    }
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          invalid && "border-destructive",
          disabled && "opacity-50",
        )}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              disabled={disabled}
              className="rounded-sm p-0.5 hover:bg-black/10"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setHighlight(0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            if (draft.trim()) add(draft); // don't silently drop a typed tag
          }}
          disabled={disabled || full}
          placeholder={full ? `Maximum ${MAX_TAGS} tags` : value.length ? "" : "Type a tag and press Enter"}
          className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Add tag"
          aria-autocomplete="list"
          aria-controls={showSuggestions ? listId : undefined}
        />
      </div>

      {showSuggestions && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover py-1 shadow-md"
        >
          {matches.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={i === highlight}
              // mousedown (not click) so it fires before the input's blur
              onMouseDown={(e) => {
                e.preventDefault();
                add(s);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "cursor-pointer px-3 py-1.5 text-sm",
                i === highlight && "bg-accent text-accent-foreground",
              )}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        {value.length}/{MAX_TAGS} tags · new tags are created automatically
      </p>
    </div>
  );
}
