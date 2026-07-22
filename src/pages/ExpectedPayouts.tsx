import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { getEligibleCommissionRequests, type EligibleCommissionRequest } from "../services";
import { daysSince, getPayoutAgingTier } from "../utils/milestones";
import { formatPHP } from "../utils/finance";
import "./ExpectedPayouts.css";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

const TIER_LABEL: Record<string, string> = { fresh: "Fresh", amber: "Aging", red: "Overdue" };
const TIER_PILL: Record<string, string> = {
  fresh: "status-pill--positive",
  amber: "status-pill--pending",
  red: "status-pill--negative",
};

export function ExpectedPayouts() {
  const { session } = useAuth();
  const [requests, setRequests] = useState<EligibleCommissionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.firmId) return;
    getEligibleCommissionRequests(session.firmId).then((data) => {
      setRequests(data.sort((a, b) => new Date(a.detectedDate).getTime() - new Date(b.detectedDate).getTime()));
      setLoading(false);
    });
  }, [session?.firmId]);

  return (
    <div className="expected-payouts-page">
      <header className="expected-payouts-page__header">
        <h1>Expected Developer Payout</h1>
        <p>
          Every tranche reached firm-wide with no voucher created yet — the anti-"walang
          transmittal" list. Aging turns amber past 7 days, red past 14.
        </p>
      </header>

      {loading ? (
        <Skeleton height={360} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Clock3}
          title="Nothing awaiting payout"
          description="Every reached tranche in your firm already has a voucher for every entitled role."
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Developer</th>
                <th>Sale</th>
                <th>Tranche</th>
                <th>Role</th>
                <th>Recipient</th>
                <th className="data-table__numeric">Expected Amount</th>
                <th>Expected Since</th>
                <th>Aging</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const tier = getPayoutAgingTier(r.detectedDate);
                const days = daysSince(r.detectedDate);
                return (
                  <tr key={`${r.milestoneEventId}-${r.breakdown.role}`}>
                    <td>{r.developer.name}</td>
                    <td>{r.client.name}</td>
                    <td>
                      {r.trancheNumber} of {r.totalTranches}
                    </td>
                    <td>{r.breakdown.role}</td>
                    <td>{r.consultantName}</td>
                    <td className="data-table__numeric money">
                      {formatPHP(r.breakdown.netCommissionReceivable)}
                    </td>
                    <td>{formatDate(r.detectedDate)}</td>
                    <td>
                      <span className={`status-pill ${TIER_PILL[tier]}`}>
                        {TIER_LABEL[tier]} · {days}d
                      </span>
                      {r.releaseBlocked ? (
                        <span className="expected-payouts-page__gate">Gate: incomplete</span>
                      ) : null}
                    </td>
                    <td>
                      <Link
                        to={`/app/vouchers/new?client=${r.client.id}&tranche=${r.trancheNumber}&role=${encodeURIComponent(r.breakdown.role)}`}
                        className="expected-payouts-page__create-link"
                      >
                        Create Voucher
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
