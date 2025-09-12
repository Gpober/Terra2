import React, { useEffect, useMemo, useRef, useState } from "react";

export type RangeValue = { start: Date | null; end: Date | null };

export type RangeCalendarProps = {
  value?: RangeValue;
  defaultValue?: RangeValue;
  onChange?: (next: RangeValue) => void;
  minDate?: Date;
  maxDate?: Date;
  initialMonth?: Date;
  weekStartsOn?: 0 | 1;
  highlightColorClass?: string;
  rangeFillClass?: string;
  className?: string;
};

// --- Date helpers (pure) ---
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBetween(date: Date, start: Date, end: Date): boolean {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function clamp(date: Date, min?: Date, max?: Date): Date {
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}

function getWeekdays(weekStartsOn: 0 | 1): string[] {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  if (weekStartsOn === 1) {
    days.push(days.shift()!);
  }
  return days;
}

function getMonthMatrix(month: Date, weekStartsOn: 0 | 1): Date[][] {
  const firstOfMonth = startOfMonth(month);
  const offset = (firstOfMonth.getDay() - weekStartsOn + 7) % 7;
  const start = addDays(firstOfMonth, -offset);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(addDays(start, w * 7 + d));
    }
    weeks.push(week);
  }
  return weeks;
}

// --- Component ---
export default function RangeCalendar({
  value,
  defaultValue = { start: null, end: null },
  onChange,
  minDate,
  maxDate,
  initialMonth,
  weekStartsOn = 0,
  highlightColorClass = "bg-[var(--accent)] text-white",
  rangeFillClass = "bg-[color:rgb(46_134_193/0.18)]",
  className,
}: RangeCalendarProps) {
  const isControlled = value !== undefined;
  const [internalRange, setInternalRange] = useState<RangeValue>(defaultValue);
  const range = isControlled ? value! : internalRange;
  const setRange = (next: RangeValue) => {
    if (!isControlled) setInternalRange(next);
    onChange?.(next);
  };

  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(initialMonth ?? range.start ?? today)
  );
  const [focusedDate, setFocusedDate] = useState<Date>(
    clamp(range.start ?? today, minDate, maxDate)
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // focus effect
  useEffect(() => {
    if (gridRef.current) {
      const selector = `[data-date="${focusedDate.toDateString()}"]`;
      const el = gridRef.current.querySelector<HTMLButtonElement>(selector);
      el?.focus();
    }
  }, [focusedDate]);

  const weeks = useMemo(
    () => getMonthMatrix(currentMonth, weekStartsOn),
    [currentMonth, weekStartsOn]
  );

  function isDisabled(day: Date): boolean {
    if (minDate && day < minDate) return true;
    if (maxDate && day > maxDate) return true;
    return false;
  }

function handleSelect(day: Date) {
  if (isDisabled(day)) return;
  if (!range.start || (range.start && range.end)) {
    setRange({ start: day, end: null });
  } else if (range.start && !range.end) {
    if (day < range.start) {
      setRange({ start: day, end: null });
    } else if (isSameDay(day, range.start)) {
      setRange({ start: day, end: null });
    } else {
      setRange({ start: range.start, end: day });
    }
  }
  setHoverDate(null);
}

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, day: Date) {
    let newDate = day;
    switch (e.key) {
      case "ArrowLeft":
        newDate = addDays(day, -1);
        break;
      case "ArrowRight":
        newDate = addDays(day, 1);
        break;
      case "ArrowUp":
        newDate = addDays(day, -7);
        break;
      case "ArrowDown":
        newDate = addDays(day, 7);
        break;
      case "Enter":
        e.preventDefault();
        handleSelect(day);
        return;
      case "Escape":
        setHoverDate(null);
        return;
      default:
        return;
    }
    e.preventDefault();
    setFocusedDate(clamp(newDate, minDate, maxDate));
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    if (newDate < start) setCurrentMonth(addMonths(currentMonth, -1));
    if (newDate > end) setCurrentMonth(addMonths(currentMonth, 1));
  }

  const monthName = currentMonth.toLocaleDateString(undefined, {
    month: "long",
  });
  const year = currentMonth.getFullYear();

  const weekdays = getWeekdays(weekStartsOn);

  return (
    <div
      className={`w-[320px] select-none ${className ?? ""}`}
      aria-label="Date range picker"
    >
      <div className="flex items-center justify-between mb-2" aria-live="polite">
        <button
          type="button"
          className="p-1" aria-label="Previous month"
          onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
        >
          <span className="sr-only">Previous</span>‹
        </button>
        <div className="font-medium text-center flex-1">{monthName}</div>
        <button
          type="button"
          className="p-1" aria-label="Next month"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <span className="sr-only">Next</span>›
        </button>
      </div>
      <div className="grid grid-cols-7 text-xs text-center text-gray-500 mb-1">
        {weekdays.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div ref={gridRef} role="grid" className="grid grid-cols-7 text-sm">
        {weeks.map((week) =>
          week.map((day) => {
            const isOutside = day.getMonth() !== currentMonth.getMonth();
            const disabled = isDisabled(day);
            const isStart = range.start && isSameDay(day, range.start);
            const isEnd = range.end && isSameDay(day, range.end);
            const inRange =
              range.start && range.end && isBetween(day, range.start, range.end);
            const preview =
              range.start && !range.end && hoverDate && hoverDate >= range.start
                ? isBetween(day, range.start, hoverDate)
                : false;
            const isToday = isSameDay(day, today);

            let rounded = "";
            if (isStart && isEnd) rounded = "rounded-md";
            else if (isStart) rounded = "rounded-l-md";
            else if (isEnd) rounded = "rounded-r-md";

            const highlight = isStart || isEnd;
            const fill = inRange || preview;

            const classes = [
              "h-10 w-10 flex items-center justify-center m-[1px] border border-gray-200",
              isOutside ? "text-gray-400" : "",
              disabled ? "opacity-30" : "cursor-pointer",
              highlight ? `${highlightColorClass} ${rounded}` : "",
              !highlight && fill ? rangeFillClass : "",
              isToday && !highlight ? "outline outline-1 outline-[var(--accent)]" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={day.toISOString()}
                role="gridcell"
                data-date={day.toDateString()}
                tabIndex={isSameDay(day, focusedDate) ? 0 : -1}
                aria-label={day.toDateString()}
                aria-selected={highlight || fill}
                className={classes}
                disabled={disabled}
                onKeyDown={(e) => handleKeyDown(e, day)}
                onClick={() => handleSelect(day)}
                onMouseEnter={() => {
                  if (range.start && !range.end && day >= range.start) {
                    setHoverDate(day);
                  } else {
                    setHoverDate(null);
                  }
                }}
                onMouseLeave={() => setHoverDate(null)}
                onFocus={() => {
                  if (range.start && !range.end && day >= range.start) {
                    setHoverDate(day);
                  } else {
                    setHoverDate(null);
                  }
                }}
              >
                {day.getDate()}
              </button>
            );
          })
        )}
      </div>
      <div className="text-center text-xs text-gray-500 mt-2">{year}</div>
      {/*
      Example:
      const [range, setRange] = useState<RangeValue>({ start: null, end: null });
      <RangeCalendar
        value={range}
        onChange={setRange}
        initialMonth={new Date(2025, 7, 1)} // August 2025
      />
      */}
    </div>
  );
}

