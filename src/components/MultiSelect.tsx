"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
  label: string; // plural form, e.g. "classes" or "properties"
};

export default function MultiSelect({
  options,
  selected,
  onChange,
  label,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const allSelected = options.length > 0 && selected.length === options.length;

  const toggle = (val: string) => {
    const next = selected.includes(val)
      ? selected.filter((v) => v !== val)
      : [...selected, val];
    onChange(next);
  };

  const selectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );

  const firstSelected = options.find((opt) => selected.includes(opt.value));

  const labelText = allSelected
    ? `All ${label}`
    : selected.length === 0
    ? `Select ${label}`
    : selected.length === 1
    ? firstSelected?.label
    : `${firstSelected?.label} +${selected.length - 1} more`;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            "w-64 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-left",
          )}
        >
          {labelText}
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
            disabled={selected.length === 0}
          >
            Clear all
          </button>
        </div>
        <input
          type="text"
          placeholder={`Filter ${label}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 w-full px-2 py-1 border rounded text-sm"
        />
        <div className="max-h-64 overflow-y-auto flex flex-col gap-1 px-1">
          {filtered.map((opt) => (
            <label key={opt.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
          {filtered.length === 0 && (
            <span className="text-sm text-gray-500 px-1">No {label} found</span>
          )}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
