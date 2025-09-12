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

  const filtered = React.useMemo(
    () =>
      options.filter((opt) =>
        opt.toLowerCase().includes(search.toLowerCase())
      ),
    [options, search]
  );

  const toggle = (opt: string) => {
    const next = new Set(selected);
    if (next.has(opt)) {
      next.delete(opt);
    } else {
      next.add(opt);
    }
    onChange(next);
  };

  const selectAll = () => onChange(new Set(options));
  const clearAll = () => onChange(new Set());

  const label = React.useMemo(() => {
    if (allSelected) return "All classes";
    if (selected.size === 0) return "Select classes";
    const arr = Array.from(selected);
    if (selected.size === 1) return arr[0];
    return `${arr[0]}, +${selected.size - 1} more`;
  }, [allSelected, selected]);

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
        <div className="flex justify-between items-center px-1 mb-2">
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline"
            onClick={selectAll}
          >
            Select all
          </button>
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline"
            onClick={clearAll}
          >
            Clear all
          </button>
        </div>
        <input
          type="text"
          placeholder="Type to filter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 w-full px-2 py-1 border rounded"
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
