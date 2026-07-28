import "./BarList.css";

export interface BarListItem {
  key: string;
  label: string;
  value: number;
  /** Pre-formatted display value, e.g. "₱1,500,000" or "12 sales" — falls back to the raw value. */
  displayValue?: string;
  /** Overrides the default ink fill — used only for genuine status meaning (e.g. aging tiers). */
  color?: string;
}

interface BarListProps {
  items: BarListItem[];
  emptyLabel?: string;
}

/** A ranked horizontal bar list — the app's one chart primitive, reused for every
 * "breakdown"/"top N" requirement instead of pulling in a charting library. Single-hue
 * by default (identity is carried by the label, per the dataviz skill's magnitude rule);
 * pass `color` per item only when color itself carries real status meaning. */
export function BarList({ items, emptyLabel = "No data for this period." }: BarListProps) {
  if (items.length === 0) {
    return <p className="bar-list__empty">{emptyLabel}</p>;
  }

  const maxValue = Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="bar-list">
      {items.map((item) => (
        <li key={item.key} className="bar-list__row" title={`${item.label}: ${item.displayValue ?? item.value}`}>
          <span className="bar-list__label">{item.label}</span>
          <span className="bar-list__track">
            <span
              className="bar-list__fill"
              style={{
                width: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 2 : 0)}%`,
                background: item.color ?? "var(--color-ink)",
              }}
            />
          </span>
          <span className="bar-list__value money">{item.displayValue ?? item.value.toLocaleString("en-PH")}</span>
        </li>
      ))}
    </ul>
  );
}
