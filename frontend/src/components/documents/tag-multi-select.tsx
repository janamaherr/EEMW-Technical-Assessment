"use client";

import { Check, ChevronsUpDown, Tags } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Multi-select tag filter (documents matching ANY selected tag). */
export function TagMultiSelect({
  options,
  selected,
  onChange,
  loading,
}: {
  options: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);

  function toggle(tag: string) {
    onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Filter by tags"
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <Tags className="size-4 text-muted-foreground" />
            {selected.length === 0 ? (
              <span className="text-muted-foreground">All tags</span>
            ) : (
              `${selected.length} tag${selected.length > 1 ? "s" : ""} selected`
            )}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search tags…" />
          <CommandList>
            <CommandEmpty>{loading ? "Loading…" : "No tags found."}</CommandEmpty>
            <CommandGroup>
              {options.map((tag) => {
                const isSelected = selected.includes(tag);
                return (
                  <CommandItem key={tag} value={tag} onSelect={() => toggle(tag)}>
                    <Check className={cn("size-4", isSelected ? "opacity-100" : "opacity-0")} />
                    {tag}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
