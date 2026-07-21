import { Mail, Phone, User } from "lucide-react";
import { VerificationBadge } from "../VerificationBadge";
import type { Consultant } from "../../types";
import "./ConsultantCard.css";

interface ConsultantCardProps {
  consultant: Consultant;
}

export function ConsultantCard({ consultant }: ConsultantCardProps) {
  return (
    <div className="consultant-card">
      <div className="consultant-card__avatar">
        <User size={20} strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="consultant-card__body">
        <div className="consultant-card__top">
          <h4>{consultant.name}</h4>
          {consultant.prcLicenseStatus !== "Unverified" ? (
            <VerificationBadge
              type="prc"
              status={consultant.prcLicenseStatus === "Verified" ? "verified" : "pending"}
              licenseNumber={consultant.prcLicenseNumber}
            />
          ) : null}
        </div>
        <span className="consultant-card__role">{consultant.role}</span>
        <div className="consultant-card__contact">
          <a href={`tel:${consultant.phone}`}>
            <Phone size={13} strokeWidth={2} aria-hidden="true" />
            {consultant.phone}
          </a>
          <a href={`mailto:${consultant.email}`}>
            <Mail size={13} strokeWidth={2} aria-hidden="true" />
            {consultant.email}
          </a>
        </div>
      </div>
    </div>
  );
}
