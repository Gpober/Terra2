"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

export type RangeValue = {
  start: Date | null;
  end: Date | null;
};

type RangeCalendarProps = {
  value: RangeValue;
  onChange: (value: RangeValue) => void;
};

export default function RangeCalendar({ value, onChange }: RangeCalendarProps) {
  const selected: DateRange | undefined = React.useMemo(() => {
    return {
      from: value.start || undefined,
      to: value.end || undefined,
    };
  }, [value.start, value.end]);

  const handleSelect = (range: DateRange | undefined) => {
    onChange({ start: range?.from ?? null, end: range?.to ?? null });
  };

  return (
    <Calendar
      mode="range"
      selected={selected}
      onSelect={handleSelect}
      numberOfMonths={2}
      defaultMonth={value.start ?? new Date()}
    />
  );
}
