"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type RangeValue = { start: Date | null; end: Date | null };

export type RangeCalendarProps = {
  value?: RangeValue; // controlled value
  defaultValue?: RangeValue; // uncontrolled default
  onChange?: (next: RangeValue) => void; // fired when range completed
  minDate?: Date;
  maxDate?: Date;
  initialMonth?: Date; // defaults to today
  weekStartsOn?: 0 | 1; // 0 = Sun, 1 = Mon
  className?: string;
};

// Utility helpers ------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const startOfMonth = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), 1);

const endOfMonth = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0);

const addMonths = (d: Date, months: number): Date =>
  new Date(d.getFullYear(), d.getMonth() + months, 1);

const addDays = (d: Date, days: number): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isBetween = (d: Date, start: Date, end: Date): boolean =>
  d > start && d < end;

const formatKey = (d: Date): string => d.toISOString().split("T")[0];

const getMonthMatrix = (month: Date, weekStartsOn: 0 | 1): Date[][] => {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const startWeekday = start.getDay();
  const endWeekday = end.getDay();
  const offsetStart = (startWeekday - weekStartsOn + 7) % 7;
  const offsetEnd = (weekStartsOn + 6 - endWeekday + 7) % 7;
  const matrixStart = addDays(start, -offsetStart);
  const matrixEnd = addDays(end, offsetEnd);
  const totalDays =
    (startOfDay(matrixEnd).getTime() - startOfDay(matrixStart).getTime()) /
      DAY_MS +
    1;
  const weeks: Date[][] = [];
  let current = matrixStart;
  for (let i = 0; i < totalDays; i++) {
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push(current);
    current = addDays(current, 1);
  }
  return weeks;
};

// ---------------------------------------------------------------------------

// Usage example:
// const [range, setRange] = useState<RangeValue>({ start: null, end: null });
// <RangeCalendar initialMonth={new Date(2025, 7, 1)} value={range} onChange={setRange} />

export default function RangeCalendar({
  value,
  defaultValue,
  onChange,
  minDate,
  maxDate,
  initialMonth,
  weekStartsOn = 0,
  className,
}: RangeCalendarProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<RangeValue>(
    defaultValue ?? { start: null, end: null }
  );
  const range = isControlled ? value! : internal;

  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    startOfMonth(initialMonth ?? today)
  );
  const [hovered, setHovered] = React.useState<Date | null>(null);
  const [focusedDate, setFocusedDate] = React.useState<Date>(
    range.start ?? today
  );
  const gridRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isControlled) {
      setInternal(value!);
    }
  }, [isControlled, value]);

  React.useEffect(() => {
    const selector = `[data-date='${formatKey(focusedDate)}']`;
    const el = gridRef.current?.querySelector<HTMLButtonElement>(selector);
    el?.focus();
  }, [focusedDate, currentMonth]);

  const setRange = (next: RangeValue, final: boolean): void => {
    if (!isControlled) setInternal(next);
    if (final) onChange?.(next);
  };

  const isDateDisabled = (d: Date): boolean => {
    const time = startOfDay(d).getTime();
    if (minDate && time < startOfDay(minDate).getTime()) return true;
    if (maxDate && time > startOfDay(maxDate).getTime()) return true;
    return false;
  };

  const handleDayClick = (date: Date): void => {
    if (isDateDisabled(date)) return;
    if (!range.start || (range.start && range.end)) {
      setRange({ start: date, end: null }, false);
    } else if (range.start && !range.end) {
      if (date < range.start) {
        setRange({ start: date, end: null }, false);
      } else {
        const next = { start: range.start, end: date };
        setRange(next, true);
      }
    }
    setFocusedDate(date);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    date: Date
  ): void => {
    let next: Date | null = null;
    switch (e.key) {
      case "ArrowLeft":
        next = addDays(date, -1);
        break;
      case "ArrowRight":
        next = addDays(date, 1);
        break;
      case "ArrowUp":
        next = addDays(date, -7);
        break;
      case "ArrowDown":
        next = addDays(date, 7);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        handleDayClick(date);
        return;
      case "Escape":
        setHovered(null);
        return;
      default:
        return;
    }
    if (next) {
      e.preventDefault();
      setFocusedDate(next);
      if (range.start && !range.end) setHovered(next);
      if (
        next.getMonth() !== currentMonth.getMonth() ||
        next.getFullYear() !== currentMonth.getFullYear()
      ) {
        setCurrentMonth(startOfMonth(next));
      }
    }
  };

  const weeks = React.useMemo(
    () => getMonthMatrix(currentMonth, weekStartsOn),
    [currentMonth, weekStartsOn]
  );

  const weekLabels = React.useMemo(() => {
    const base = ["S", "M", "T", "W", "T", "F", "S"];
    return weekStartsOn === 0 ? base : [...base.slice(1), base[0]];
  }, [weekStartsOn]);

  const previewEnd =
    range.start && !range.end && hovered && hovered >= range.start
      ? hovered
      : null;

  return (
    <div className={cn("w-80", className)}>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => {
            const next = addMonths(currentMonth, -1);
            setCurrentMonth(next);
            setFocusedDate(startOfMonth(next));
          }}
          aria-label="Previous month"
          className="p-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 text-center font-medium" aria-live="polite">
          {currentMonth.toLocaleString("default", { month: "long" })}
        </div>
        <button
          type="button"
          onClick={() => {
            const next = addMonths(currentMonth, 1);
            setCurrentMonth(next);
            setFocusedDate(startOfMonth(next));
          }}
          aria-label="Next month"
          className="p-2"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs mb-1">
        {weekLabels.map((d) => (
          <div key={d} className="h-8 flex items-center justify-center">
            {d}
          </div>
        ))}
      </div>
      <div ref={gridRef} role="grid" className="grid grid-cols-7" onMouseLeave={() => setHovered(null)}>
        {weeks.flat().map((date) => {
          const key = formatKey(date);
          const isCurrentMonth =
            date.getMonth() === currentMonth.getMonth();
          const disabled = isDateDisabled(date);
          const isStart = !!(range.start && isSameDay(date, range.start));
          const isEnd = !!(range.end && isSameDay(date, range.end));
          const inRange = !!(
            range.start &&
            range.end &&
            isBetween(date, range.start, range.end)
          );
          const inPreview = !!(
            range.start &&
            !range.end &&
            previewEnd &&
            isBetween(date, range.start, previewEnd)
          );
          const isPreviewEnd = !!(
            previewEnd && isSameDay(date, previewEnd)
          );
          const isSelected = isStart || isEnd;

          const classNames = cn(
            "relative w-10 h-10 flex items-center justify-center text-sm focus:outline-none",
            !isCurrentMonth && "text-gray-400",
            disabled && "text-gray-300 pointer-events-none",
            (inRange || inPreview) && "bg-[#2E86C1]/20",
            isStart &&
              !range.end &&
              !previewEnd &&
              "bg-[#2E86C1] text-white rounded-full",
            isStart &&
              (range.end || previewEnd) &&
              "bg-[#2E86C1] text-white rounded-l-full",
            (isEnd || isPreviewEnd) &&
              "bg-[#2E86C1] text-white rounded-r-full",
            isStart && isEnd && "rounded-full",
            isPreviewEnd && !range.end && "rounded-r-full",
            isToday(date) && !isSelected && "ring-1 ring-gray-400"
          );

          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              tabIndex={isSameDay(date, focusedDate) ? 0 : -1}
              aria-selected={isSelected}
              aria-label={date.toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              data-date={key}
              onKeyDown={(e) => handleKeyDown(e, date)}
              onClick={() => handleDayClick(date)}
              onMouseEnter={() => {
                if (range.start && !range.end && date >= range.start) {
                  setHovered(date);
                }
              }}
              className={classNames}
              disabled={disabled}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      <div className="text-center mt-2 text-sm" aria-live="polite">
        {currentMonth.getFullYear()}
      </div>
    </div>
  );

  function isToday(d: Date): boolean {
    return isSameDay(d, today);
  }
}

