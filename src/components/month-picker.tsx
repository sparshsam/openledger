"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type MonthPickerProps = {
  value: string;        // "YYYY-MM"
  onChange: (month: string) => void;
  label?: string;       // "Select month"
};

function getMonths(): { label: string; value: string; isCurrent: boolean }[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const months: { label: string; value: string; isCurrent: boolean }[] = [];

  for (let i = 12; i >= 1; i--) {
    // i months ago from current month
    let monthIndex = currentMonth - i;
    let year = currentYear;
    if (monthIndex < 0) {
      monthIndex += 12;
      year -= 1;
    }
    const d = new Date(year, monthIndex, 1);
    const label = d.toLocaleString("en-CA", {
      month: "long",
      year: "numeric",
    });
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const isCurrent = i === 0;
    months.push({ label, value, isCurrent });
  }

  // Add the current month (0 months ago)
  const currentLabel = now.toLocaleString("en-CA", {
    month: "long",
    year: "numeric",
  });
  const currentValue = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  months.push({ label: currentLabel, value: currentValue, isCurrent: true });

  return months;
}

export function MonthPicker({
  value,
  onChange,
  label = "Select month",
}: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState<number>(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const months = getMonths();
  const selectedMonth = months.find((m) => m.value === value);
  const displayText = selectedMonth?.label ?? label;

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        // Find the selected index to focus it on open
        const idx = months.findIndex((m) => m.value === value);
        setFocusedIdx(idx >= 0 ? idx : 0);
      }
      return !prev;
    });
  }, [months, value]);

  const handleSelect = useCallback(
    (monthValue: string) => {
      onChange(monthValue);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          const idx = months.findIndex((m) => m.value === value);
          setFocusedIdx(idx >= 0 ? idx : 0);
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedIdx((prev) => (prev < months.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIdx((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusedIdx >= 0 && focusedIdx < months.length) {
            handleSelect(months[focusedIdx].value);
          }
          break;
        case "Home":
          e.preventDefault();
          setFocusedIdx(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedIdx(months.length - 1);
          break;
      }
    },
    [open, focusedIdx, months, value, handleSelect]
  );

  // Scroll focused item into view
  useEffect(() => {
    if (!open || focusedIdx < 0) return;
    const items = listRef.current?.querySelectorAll<HTMLLIElement>("[role='option']");
    if (items && items[focusedIdx]) {
      items[focusedIdx].scrollIntoView({ block: "nearest" });
    }
  }, [focusedIdx, open]);

  // Outside click detection
  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  return (
    <div className="relative inline-block" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={handleToggle}
        className="rounded-full px-5 py-2.5 text-sm font-semibold bg-[#EBE5D8] text-[#3A2A1A] hover:brightness-95 transition cursor-pointer flex items-center gap-2"
      >
        <span>{displayText}</span>
        <svg
          className={`w-3.5 h-3.5 text-[#3A2A1A] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 14 14"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path d="M3 5l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div
          ref={popoverRef}
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-full mt-1 bg-[#F5F0E8] border border-[rgba(0,0,0,0.08)] rounded-2xl shadow-lg py-1 min-w-[200px] z-50"
        >
          <ul ref={listRef} className="max-h-[320px] overflow-y-auto">
            {months.map((month, idx) => (
              <li
                key={month.value}
                role="option"
                aria-selected={month.value === value}
                className={`px-5 py-2.5 text-sm font-medium text-[#3A2A1A] hover:bg-[#EBE5D8] cursor-pointer transition flex justify-between items-center ${
                  focusedIdx === idx ? "bg-[#EBE5D8]" : ""
                }`}
                onClick={() => handleSelect(month.value)}
                onMouseEnter={() => setFocusedIdx(idx)}
              >
                <span
                  className={
                    month.value === value
                      ? "text-[#7A2F00] font-bold"
                      : undefined
                  }
                >
                  {month.label}
                </span>
                <span className="flex items-center gap-1.5">
                  {month.value === value && (
                    <svg
                      className="w-4 h-4 text-[#7A2F00]"
                      fill="none"
                      viewBox="0 0 16 16"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    >
                      <path d="M3 8l3 3 7-7" />
                    </svg>
                  )}
                  {month.isCurrent && month.value !== value && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7A2F00]" />
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
