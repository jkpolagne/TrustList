import { Award, MapPin, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import "./VerificationBadge.css";

export type VerificationBadgeType = "prc" | "ownership" | "dhsud" | "dhsud-registration" | "consultant";
export type VerificationBadgeStatus = "verified" | "pending" | "expired";

export interface VerificationBadgeProps {
  type: VerificationBadgeType;
  status: VerificationBadgeStatus;
  /** Shown only for a verified PRC badge. */
  licenseNumber?: string;
  /** Overrides the default type/status label — the Consultant Verified badge needs
   * fully dynamic text ("Personally visited by X on Y") rather than a fixed phrase. */
  label?: string;
}

const LABELS: Record<VerificationBadgeType, Record<VerificationBadgeStatus, string>> = {
  prc: { verified: "PRC Verified", pending: "PRC Pending", expired: "PRC Expired" },
  ownership: {
    verified: "Ownership Verified",
    pending: "Ownership Pending Review",
    expired: "Ownership Rejected",
  },
  // Developer's License to Sell — distinct from an individual consultant's DHSUD
  // registration below, even though both are DHSUD credentials.
  dhsud: { verified: "DHSUD Licensed", pending: "License Unverified", expired: "License Expired" },
  "dhsud-registration": {
    verified: "DHSUD Registered",
    pending: "DHSUD Pending",
    expired: "DHSUD Registered",
  },
  consultant: { verified: "Consultant Verified", pending: "Consultant Verified", expired: "Consultant Verified" },
};

export function VerificationBadge({ type, status, licenseNumber, label: labelOverride }: VerificationBadgeProps) {
  const label = labelOverride ?? LABELS[type][status];

  return (
    <span className={`verification-badge verification-badge--${status}`}>
      {type === "consultant" ? (
        <MapPin size={14} strokeWidth={2} aria-hidden="true" />
      ) : type === "dhsud" || type === "dhsud-registration" ? (
        <Award size={14} strokeWidth={2} aria-hidden="true" />
      ) : status === "verified" ? (
        <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
      ) : status === "expired" ? (
        <ShieldAlert size={14} strokeWidth={2} aria-hidden="true" />
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
