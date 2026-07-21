import { ShieldCheck, ShieldQuestion } from "lucide-react";
import "./VerificationBadge.css";

export type VerificationBadgeType = "prc" | "ownership";
export type VerificationBadgeStatus = "verified" | "pending";

export interface VerificationBadgeProps {
  type: VerificationBadgeType;
  status: VerificationBadgeStatus;
  /** Shown only for a verified PRC badge. */
  licenseNumber?: string;
}

const LABELS: Record<VerificationBadgeType, Record<VerificationBadgeStatus, string>> = {
  prc: { verified: "PRC Verified", pending: "PRC Pending" },
  ownership: { verified: "Ownership Verified", pending: "Ownership Pending Review" },
};

export function VerificationBadge({ type, status, licenseNumber }: VerificationBadgeProps) {
  const label = LABELS[type][status];

  return (
    <span className={`verification-badge verification-badge--${status}`}>
      {status === "verified" ? (
        <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
      ) : (
        <ShieldQuestion size={14} strokeWidth={2} aria-hidden="true" />
      )}
      <span>
        {label}
        {type === "prc" && status === "verified" && licenseNumber ? (
          <span className="verification-badge__meta"> · {licenseNumber}</span>
        ) : null}
      </span>
    </span>
  );
}
