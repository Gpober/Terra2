"use client";

import * as React from "react";

type ClassMultiSelectProps = {
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
};

export default function ClassMultiSelect({ options, selected, onChange }: ClassMultiSelectProps) {
  const toggle = (opt: string) => {
    const next = new Set(selected);
    if (next.has(opt)) {
      next.delete(opt);
    } else {
      next.add(opt);
    }
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label key={opt} className="flex items-center space-x-1">
          <input
            type="checkbox"
            checked={selected.has(opt)}
            onChange={() => toggle(opt)}
            className="h-4 w-4"
          />
          <span className="text-sm">{opt}</span>
        </label>
      ))}
    </div>
  );
}
