"use client";

import React from "react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  className?: string;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className,
}: DateRangePickerProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <input
        type="date"
        value={startDate}
        onChange={(e) => onChange(e.target.value, endDate)}
        className="border border-gray-300 rounded px-2 py-1"
      />
      <span className="text-gray-600">to</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onChange(startDate, e.target.value)}
        className="border border-gray-300 rounded px-2 py-1"
      />
    </div>
  );
}

