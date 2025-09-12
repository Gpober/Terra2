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
  const [search, setSearch] = React.useState("");

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

  const selectAll = () => {
    onChange(new Set(options));
  };

  const clearAll = () => {
    onChange(new Set());
  };

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase()),
  );

  const firstSelected = options.find((opt) => selected.has(opt));

  const label = allSelected
    ? "All classes"
    : selected.size === 0
    ? "Select classes"
    : selected.size === 1
    ? firstSelected
    : `${firstSelected} +${selected.size - 1} more`;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            "w-64 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-left",
          )}
        >
          {label}
        </button>
      </Popover.Trigger>
      <Popover.Content
        align="start"
        className="p-2 bg-white rounded-md shadow-md border w-64"
      >
        <div className="flex items-center justify-between px-1 mb-2">
          <button
            className="text-xs text-blue-600 underline disabled:opacity-50"
            onClick={selectAll}
            disabled={allSelected}
          >
            Select all
          </button>
          <button
            className="text-xs text-blue-600 underline disabled:opacity-50"
            onClick={clearAll}
            disabled={selected.size === 0}
          >
            Clear all
          </button>
        </div>
        <input
          type="text"
          placeholder="Filter classes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 w-full px-2 py-1 border rounded text-sm"
        />
        <div className="max-h-64 overflow-y-auto flex flex-col gap-1 px-1">
          {filtered.map((opt) => (
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
          {filtered.length === 0 && (
            <span className="text-sm text-gray-500 px-1">No classes found</span>
          )}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
