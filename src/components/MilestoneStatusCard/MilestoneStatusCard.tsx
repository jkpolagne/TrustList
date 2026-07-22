import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusCard } from "../StatusCard";
import type { MilestoneEvent } from "../../types";
import { daysSince, isMilestoneAging } from "../../utils/milestones";
import "./MilestoneStatusCard.css";

interface MilestoneStatusCardProps {
  milestone: MilestoneEvent;
  /** Shown when this card appears in an aggregate list (e.g. the Dashboard) alongside other clients'. */
  clientName?: string;
  clientId?: string;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MilestoneStatusCard({ milestone, clientName, clientId }: MilestoneStatusCardProps) {
  const resolved = milestone.voucherStatus === "Voucher Created";
  const aging = !resolved && isMilestoneAging(milestone.detectedDate);
  const pendingDays = daysSince(milestone.detectedDate);

  const accent = aging ? "amber" : "gold";
  const Icon = resolved ? CheckCircle2 : aging ? AlertTriangle : Clock;
  const iconModifier = resolved ? "resolved" : aging ? "aging" : "fresh";

  const body = (
    <div className="milestone-status-card">
      <div className={`milestone-status-card__icon milestone-status-card__icon--${iconModifier}`}>
        <Icon size={18} strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="milestone-status-card__text">
        {clientName ? <span className="milestone-status-card__client">{clientName}</span> : null}
        <span className="milestone-status-card__headline">
          {resolved
            ? `Tranche ${milestone.trancheNumber} of ${milestone.totalTranches} — voucher created`
            : `Milestone reached — Tranche ${milestone.trancheNumber} of ${milestone.totalTranches} — voucher pending`}
        </span>
        <span className="milestone-status-card__meta">
          Detected {formatDate(milestone.detectedDate)}
          {!resolved ? (
            <span className={`milestone-status-card__aging${aging ? " milestone-status-card__aging--warn" : ""}`}>
              · Pending {pendingDays} {pendingDays === 1 ? "day" : "days"}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );

  return (
    <StatusCard accent={accent}>
      {clientId ? (
        <Link to={`/app/clients/${clientId}`} className="milestone-status-card__link">
          {body}
        </Link>
      ) : (
        body
      )}
    </StatusCard>
  );
}
