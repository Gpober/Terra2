"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format, parse } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

export interface DateRangeValue {
  start?: string
  end?: string
}

interface DateRangePickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
}

export function DateRangePicker({ value, onChange, className, ...props }: DateRangePickerProps) {
  const toDate = (s?: string) => (s ? parse(s, "yyyy-MM-dd", new Date()) : undefined)
  const selected: DateRange | undefined = value.start
    ? { from: toDate(value.start), to: toDate(value.end) }
    : undefined

  const handleSelect = (range: DateRange | undefined) => {
    onChange({
      start: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
      end: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
    })
  }

  return (
    <div className={cn("grid gap-2", className)} {...props}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-start px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-blue-500 focus:outline-none focus:ring-2 transition-all",
              !value.start && "text-gray-500"
            )}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            {value.start ? (
              value.end ? (
                <>
                  {format(toDate(value.start)!, "LLL dd, y")} -{" "}
                  {format(toDate(value.end)!, "LLL dd, y")}
                </>
              ) : (
                format(toDate(value.start)!, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            numberOfMonths={1}
            selected={selected}
            defaultMonth={selected?.from}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

