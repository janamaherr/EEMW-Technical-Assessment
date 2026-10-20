"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Department } from "@/types/api";

export function DepartmentCheckboxes({
  departments,
  selected,
  onChange,
  disabled,
}: {
  departments: Department[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const uid = useId();

  function toggle(id: string, checked: boolean) {
    onChange(checked ? [...selected, id] : selected.filter((s) => s !== id));
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {departments.map((d) => {
        const id = `${uid}-${d.id}`;
        return (
          <div key={d.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
            <Checkbox
              id={id}
              checked={selected.includes(d.id)}
              onCheckedChange={(checked) => toggle(d.id, checked === true)}
              disabled={disabled}
            />
            <Label htmlFor={id} className="cursor-pointer font-normal">
              {d.name}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
