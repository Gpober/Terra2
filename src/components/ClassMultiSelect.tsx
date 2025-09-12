"use client";

import React from "react";

interface ClassMultiSelectProps {
  options: string[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  accentColor?: string;
  label?: string;
}

export default function ClassMultiSelect({
  options,
  selected,
  onChange,
  accentColor = "#3b82f6",
  label,
}: ClassMultiSelectProps) {
  const toggle = (option: string) => {
    if (option === "All Classes") {
      const newSet = new Set<string>();
      newSet.add("All Classes");
      onChange(newSet);
      return;
    }
    const newSet = new Set(selected);
    newSet.delete("All Classes");
    if (newSet.has(option)) {
      newSet.delete(option);
    } else {
      newSet.add(option);
    }
    if (newSet.size === 0) {
      newSet.add("All Classes");
    }
    onChange(newSet);
  };

  return (
    <div className="flex flex-col">
      {label && (
        <label className="text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}
      <div className="flex flex-col border rounded-lg p-2 max-h-48 overflow-y-auto">
        {options.map((opt) => (
          <label key={opt} className="inline-flex items-center gap-2 py-1">
            <input
              type="checkbox"
              checked={selected.has(opt)}
              onChange={() => toggle(opt)}
              className="rounded"
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

