import type { Developer } from "../../types";
import { VerificationBadge, type VerificationBadgeStatus } from "../VerificationBadge";
import "./DeveloperInfoCard.css";

const BADGE_STATUS_BY_LICENSE: Record<Developer["dhsudLicenseStatus"], VerificationBadgeStatus> = {
  Active: "verified",
  "Not Available": "pending",
  Expired: "expired",
};

export type DeveloperInfoCardData = Pick<
  Developer,
  "name" | "establishedYear" | "dhsudLicenseNumber" | "dhsudLicenseStatus" | "totalProjectsCompleted" | "about"
>;

export function DeveloperInfoCard({ developer }: { developer: DeveloperInfoCardData }) {
  return (
    <div className="developer-info-card">
      <div className="developer-info-card__header">
        <strong>{developer.name}</strong>
        <span className="developer-info-card__established">Established {developer.establishedYear}</span>
      </div>

      <div className="developer-info-card__row">
        <span className="developer-info-card__label">
          DHSUD License: {developer.dhsudLicenseNumber || "—"}
        </span>
        <VerificationBadge type="dhsud" status={BADGE_STATUS_BY_LICENSE[developer.dhsudLicenseStatus]} />
      </div>

      <div className="developer-info-card__row">
        <span className="developer-info-card__label">Projects Completed</span>
        <span className="developer-info-card__value">{developer.totalProjectsCompleted}</span>
      </div>

      <p className="developer-info-card__about">{developer.about}</p>
    </div>
  );
}
