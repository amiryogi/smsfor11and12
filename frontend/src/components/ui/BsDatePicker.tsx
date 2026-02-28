import { useState, useRef, useEffect, useCallback } from "react";
import {
  adToBs,
  bsToAd,
  formatBsDate,
  daysInBsMonth,
  getStartDayOfWeek,
  BS_MONTH_NAMES_EN,
  BS_MIN_YEAR,
  BS_MAX_YEAR,
  type BsDate,
} from "../../utils/nepali-date";

interface BsDatePickerProps {
  /** Selected AD date as ISO string (YYYY-MM-DD) */
  value?: string;
  /** Callback with AD date ISO string */
  onChange: (isoDate: string) => void;
  /** Input placeholder */
  placeholder?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** CSS class for the wrapper */
  className?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function BsDatePicker({
  value,
  onChange,
  placeholder = "Select BS date",
  disabled = false,
  className = "",
}: BsDatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Current BS date from value, or today
  const currentBs: BsDate = value
    ? adToBs(new Date(value))
    : adToBs(new Date());

  const [viewYear, setViewYear] = useState(currentBs.year);
  const [viewMonth, setViewMonth] = useState(currentBs.month);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const days = daysInBsMonth(viewYear, viewMonth);
  const startDay = getStartDayOfWeek(viewYear, viewMonth);

  const handleSelect = useCallback(
    (day: number) => {
      const adDate = bsToAd({ year: viewYear, month: viewMonth, day });
      const iso = adDate.toISOString().split("T")[0];
      onChange(iso);
      setOpen(false);
    },
    [viewYear, viewMonth, onChange],
  );

  const prevMonth = () => {
    if (viewMonth === 1) {
      if (viewYear > BS_MIN_YEAR) {
        setViewYear(viewYear - 1);
        setViewMonth(12);
      }
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      if (viewYear < BS_MAX_YEAR) {
        setViewYear(viewYear + 1);
        setViewMonth(1);
      }
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const displayText = value ? formatBsDate(adToBs(new Date(value))) : "";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        type="text"
        readOnly
        className="input cursor-pointer"
        value={displayText}
        placeholder={placeholder}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
      />

      {open && (
        <div className="absolute z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          {/* Header: month/year navigation */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded p-1 text-gray-600 hover:bg-gray-100"
            >
              ◀
            </button>

            <div className="flex items-center gap-2">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="rounded border border-gray-200 px-1 py-0.5 text-sm"
              >
                {BS_MONTH_NAMES_EN.map((name, i) => (
                  <option key={i} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="rounded border border-gray-200 px-1 py-0.5 text-sm"
              >
                {Array.from(
                  { length: BS_MAX_YEAR - BS_MIN_YEAR + 1 },
                  (_, i) => BS_MIN_YEAR + i,
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="rounded p-1 text-gray-600 hover:bg-gray-100"
            >
              ▶
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 text-center text-sm">
            {/* Empty cells before first day */}
            {Array.from({ length: startDay }, (_, i) => (
              <div key={`e-${i}`} className="py-1" />
            ))}

            {Array.from({ length: days }, (_, i) => {
              const day = i + 1;
              const isSelected =
                value &&
                currentBs.year === viewYear &&
                currentBs.month === viewMonth &&
                currentBs.day === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={`rounded py-1 transition-colors ${
                    isSelected
                      ? "bg-primary-600 font-semibold text-white"
                      : "text-gray-700 hover:bg-primary-50"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today button */}
          <div className="mt-2 border-t border-gray-100 pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const todayBs = adToBs(today);
                setViewYear(todayBs.year);
                setViewMonth(todayBs.month);
                handleSelect(todayBs.day);
              }}
              className="text-xs font-medium text-primary-600 hover:underline"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
