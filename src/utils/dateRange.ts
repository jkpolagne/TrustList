export interface DateRange {
  /** Inclusive, "YYYY-MM-DD". */
  start: string;
  /** Inclusive, "YYYY-MM-DD". */
  end: string;
}

export type DateRangePreset =
  | "This Month"
  | "Last Month"
  | "Last 3 Months"
  | "Last 6 Months"
  | "This Year"
  | "All Time"
  | "Custom";

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  "This Month",
  "Last Month",
  "Last 3 Months",
  "Last 6 Months",
  "This Year",
  "All Time",
];

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** All-Time is represented as a very wide literal range rather than a special-cased
 * undefined, so every consumer can treat DateRange uniformly. */
export function getPresetRange(preset: DateRangePreset, reference: Date = new Date()): DateRange {
  const year = reference.getFullYear();
  const month = reference.getMonth();

  switch (preset) {
    case "This Month":
      return { start: toIsoDate(new Date(year, month, 1)), end: toIsoDate(reference) };
    case "Last Month":
      return {
        start: toIsoDate(new Date(year, month - 1, 1)),
        end: toIsoDate(new Date(year, month, 0)),
      };
    case "Last 3 Months":
      return { start: toIsoDate(new Date(year, month - 2, 1)), end: toIsoDate(reference) };
    case "Last 6 Months":
      return { start: toIsoDate(new Date(year, month - 5, 1)), end: toIsoDate(reference) };
    case "This Year":
      return { start: toIsoDate(new Date(year, 0, 1)), end: toIsoDate(reference) };
    case "All Time":
    default:
      return { start: "2000-01-01", end: toIsoDate(new Date(year + 1, 0, 1)) };
  }
}

export function isWithinRange(dateStr: string | undefined, range: DateRange): boolean {
  if (!dateStr) return false;
  const d = dateStr.slice(0, 10);
  return d >= range.start && d <= range.end;
}

export function formatRangeLabel(range: DateRange): string {
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  return `${fmt(range.start)} – ${fmt(range.end)}`;
}
