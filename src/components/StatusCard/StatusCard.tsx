import type { ReactNode } from "react";
import "./StatusCard.css";

export type StatusCardAccent = "green" | "amber" | "red" | "gold" | "neutral";

export interface StatusCardProps {
  accent?: StatusCardAccent;
  title?: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function StatusCard({
  accent = "neutral",
  title,
  subtitle,
  children,
  className,
}: StatusCardProps) {
  return (
    <div className={`status-card status-card--${accent} ${className ?? ""}`}>
      <div className="status-card__accent" />
      <div className="status-card__body">
        {title ? <h3 className="status-card__title">{title}</h3> : null}
        {subtitle ? <p className="status-card__subtitle">{subtitle}</p> : null}
        {children}
      </div>
    </div>
  );
}
