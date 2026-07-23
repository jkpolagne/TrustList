import { AlertOctagon, AlertTriangle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusCard, type StatusCardAccent } from "../StatusCard";
import type { EligibleCommissionRequest } from "../../services";
import { daysSince, getPayoutAgingTier } from "../../utils/milestones";
import { formatPHP } from "../../utils/finance";
import "./AwaitingPayoutCard.css";

interface AwaitingPayoutCardProps {
  request: EligibleCommissionRequest;
  /** Broker view: show which role/consultant this specific entry belongs to. */
  showRecipient?: boolean;
  consultantName?: string;
  /** Overrides the default client-detail link — the Broker dashboard points this at
   * Create Voucher instead, since Brokers don't have a client-detail route of their own. */
  linkTo?: string;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

const TIER_ACCENT: Record<string, StatusCardAccent> = { fresh: "gold", amber: "amber", red: "red" };
const TIER_ICON = { fresh: Clock, amber: AlertTriangle, red: AlertOctagon };

export function AwaitingPayoutCard({
  request,
  showRecipient,
  consultantName,
  linkTo,
}: AwaitingPayoutCardProps) {
  const tier = getPayoutAgingTier(request.detectedDate);
  const pendingDays = daysSince(request.detectedDate);
  const Icon = TIER_ICON[tier];

  return (
    <StatusCard accent={TIER_ACCENT[tier]}>
      <Link to={linkTo ?? `/app/clients/${request.client.id}`} className="awaiting-payout-card">
        <div className={`awaiting-payout-card__icon awaiting-payout-card__icon--${tier}`}>
          <Icon size={18} strokeWidth={2} aria-hidden="true" />
        </div>
        <div className="awaiting-payout-card__text">
          <span className="awaiting-payout-card__headline">
            {request.developer.name} · {request.client.name} — Tranche {request.trancheNumber} of{" "}
            {request.totalTranches}
          </span>
          {showRecipient ? (
            <span className="awaiting-payout-card__recipient">
              {request.breakdown.role}
              {consultantName ? ` — ${consultantName}` : ""}
            </span>
          ) : null}
          <span className="awaiting-payout-card__amount money">
            {formatPHP(request.breakdown.netCommissionReceivable)} expected
          </span>
          <span className="awaiting-payout-card__meta">
            Expected since {formatDate(request.detectedDate)}
            <span className={`awaiting-payout-card__aging awaiting-payout-card__aging--${tier}`}>
              · Pending {pendingDays} {pendingDays === 1 ? "day" : "days"}
            </span>
          </span>
        </div>
      </Link>
    </StatusCard>
  );
}
