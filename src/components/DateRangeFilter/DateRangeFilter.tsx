import { Calendar } from "lucide-react";
import { DATE_RANGE_PRESETS, getPresetRange, type DateRange, type DateRangePreset } from "../../utils/dateRange";
import "./DateRangeFilter.css";

interface DateRangeFilterProps {
  preset: DateRangePreset;
  range: DateRange;
  onChange: (preset: DateRangePreset, range: DateRange) => void;
}

/** Preset dropdown plus a from/to pair that only appears for "Custom" — switching
 * presets recomputes the range immediately so callers never juggle stale dates. */
export function DateRangeFilter({ preset, range, onChange }: DateRangeFilterProps) {
  function handlePresetChange(next: string) {
    if (next === "Custom") {
      onChange("Custom", range);
      return;
    }
    const nextPreset = next as DateRangePreset;
    onChange(nextPreset, getPresetRange(nextPreset));
  }

  return (
    <div className="date-range-filter">
      <Calendar size={14} strokeWidth={2} aria-hidden="true" />
      <select
        aria-label="Date range preset"
        value={preset}
        onChange={(e) => handlePresetChange(e.target.value)}
      >
        {DATE_RANGE_PRESETS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
        <option value="Custom">Custom range</option>
      </select>
      {preset === "Custom" ? (
        <>
          <input
            type="date"
            aria-label="From date"
            value={range.start}
            onChange={(e) => onChange("Custom", { ...range, start: e.target.value })}
          />
          <span className="date-range-filter__sep">–</span>
          <input
            type="date"
            aria-label="To date"
            value={range.end}
            onChange={(e) => onChange("Custom", { ...range, end: e.target.value })}
          />
        </>
      ) : null}
    </div>
  );
}
