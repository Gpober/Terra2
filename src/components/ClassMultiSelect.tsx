"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

type ClassMultiSelectProps = {
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
};

export default function ClassMultiSelect({ options, selected, onChange }: ClassMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const allSelected = options.length > 0 && selected.size === options.length;

  const toggle = (opt: string) => {
    const next = new Set(selected);
    if (next.has(opt)) {
      next.delete(opt);
    } else {
      next.add(opt);
    }
    onChange(next);
  };

  const toggleAll = () => {
    if (allSelected) {
      onChange(new Set());
    } else {
      onChange(new Set(options));
    }
  };

  const label = allSelected
    ? "All classes"
    : selected.size > 0
    ? `${selected.size} selected`
    : "Select classes";

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            "w-64 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-left"
          )}
        >
          {label}
        </button>
      </Popover.Trigger>
      <Popover.Content align="start" className="p-2 bg-white rounded-md shadow-md border w-64">
        <div className="flex items-center space-x-2 px-1 mb-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={allSelected}
            onChange={toggleAll}
          />
          <span className="text-sm">Select all</span>
        </div>
        <div className="max-h-64 overflow-y-auto flex flex-col gap-1 px-1">
          {options.map((opt) => (
            <label key={opt} className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={selected.has(opt)}
                onChange={() => toggle(opt)}
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
