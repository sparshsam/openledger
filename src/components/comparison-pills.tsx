"use client";

/**
 * ComparisonPills — Pill-shaped range selector for comparison charts.
 *
 * Maps ComparisonRange values to human-readable labels, rendering
 * an active pill and inactive pills that the user can click to switch.
 */

import type { ComparisonRange } from "@/lib/finance/comparisons";

export const COMPARISON_RANGES: ComparisonRange[] = [
  "this_week",
  "last_week",
  "last_month",
  "last_3_months",
  "last_6_months",
  "last_year",
];

export const COMPARISON_LABELS: Record<ComparisonRange, string> = {
  this_week: "This Week",
  last_week: "Last Week",
  last_month: "Last Month",
  last_3_months: "3 Months",
  last_6_months: "6 Months",
  last_year: "Last Year",
};

type ComparisonPillsProps = {
  active: ComparisonRange;
  onChange: (range: ComparisonRange) => void;
};

export function ComparisonPills({ active, onChange }: ComparisonPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {COMPARISON_RANGES.map((range) => {
        const isActive = range === active;
        return (
          <button
            key={range}
            onClick={() => onChange(range)}
            className={
              isActive
                ? "rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer bg-[#7A2F00] text-white"
                : "rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer bg-[#EBE5D8] text-[#3A2A1A]/60 hover:text-[#3A2A1A] hover:brightness-95"
            }
          >
            {COMPARISON_LABELS[range]}
          </button>
        );
      })}
    </div>
  );
}
