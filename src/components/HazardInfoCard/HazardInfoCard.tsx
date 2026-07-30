import { AlertTriangle } from "lucide-react";
import type { HazardInfo, RiskLevel, RiskLevelOrNA } from "../../types";
import "./HazardInfoCard.css";

const RISK_ACCENT: Record<RiskLevelOrNA, "green" | "amber" | "red" | "neutral"> = {
  Low: "green",
  Moderate: "amber",
  High: "red",
  "Not Applicable": "neutral",
};

function RiskRow({ label, value }: { label: string; value: RiskLevel | RiskLevelOrNA }) {
  return (
    <div className="hazard-info-card__row">
      <span className="hazard-info-card__label">{label}</span>
      <span className={`hazard-info-card__pill hazard-info-card__pill--${RISK_ACCENT[value]}`}>{value}</span>
    </div>
  );
}

export function HazardInfoCard({ hazardInfo }: { hazardInfo: HazardInfo }) {
  return (
    <div className="hazard-info-card">
      <div className="hazard-info-card__grid">
        <RiskRow label="Flood Risk" value={hazardInfo.floodRisk} />
        <RiskRow label="Storm Surge Risk" value={hazardInfo.stormSurgeRisk} />
        <RiskRow label="Landslide Risk" value={hazardInfo.landslideRisk} />
        <div className="hazard-info-card__row">
          <span className="hazard-info-card__label">Nearest Evacuation Center</span>
          <span className="hazard-info-card__evac">{hazardInfo.nearestEvacuationCenter}</span>
        </div>
      </div>
      <p className="hazard-info-card__source">{hazardInfo.dataSource}</p>
      <p className="hazard-info-card__disclaimer">
        <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" />
        This information is for reference only. Buyers are advised to verify current hazard
        status with the local government unit and PHIVOLCS before making a purchase decision.
      </p>
    </div>
  );
}
