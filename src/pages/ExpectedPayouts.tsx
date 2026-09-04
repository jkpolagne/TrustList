import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import {
  getBlockedCommissionRequests,
  getEligibleCommissionRequests,
  type BlockedCommissionRequest,
  type EligibleCommissionRequest,
} from "../services";
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

type Row =
  | { kind: "eligible"; request: EligibleCommissionRequest }
  | { kind: "blocked"; request: BlockedCommissionRequest };

export function ExpectedPayouts() {
  const { session } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.firmId) return;
    Promise.all([
      getEligibleCommissionRequests(session.firmId),
      getBlockedCommissionRequests(session.firmId),
    ]).then(([eligible, blocked]) => {
      const combined: Row[] = [
        ...eligible.map((request): Row => ({ kind: "eligible", request })),
        ...blocked.map((request): Row => ({ kind: "blocked", request })),
      ].sort(
        (a, b) => new Date(a.request.detectedDate).getTime() - new Date(b.request.detectedDate).getTime(),
      );
      setRows(combined);
      setLoading(false);
    });
  }, [session?.firmId]);

  return (
    <div className="expected-payouts-page">
      <header className="expected-payouts-page__header">
        <h1>Expected Developer Payout</h1>
        <p>
          Every tranche reached firm-wide with no voucher created yet — the anti-"walang
          transmittal" list. Aging turns amber past 7 days, red past 14. Bank-financing tranches
          held up by an incomplete requirements checklist stay listed as "Awaiting Documents"
          instead of disappearing, so nothing owed goes unseen.
        </p>
      </header>

      {loading ? (
        <Skeleton height={360} />
      ) : rows.length === 0 ? (
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
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const r = row.request;
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
                      {row.kind === "blocked" ? (
                        <span className="status-pill status-pill--negative">
                          Awaiting Documents · {row.request.requirementsState}
                        </span>
                      ) : (
                        <span className={`status-pill ${TIER_PILL[tier]}`}>
                          {TIER_LABEL[tier]} · {days}d
                        </span>
                      )}
                    </td>
                    <td>
                      {row.kind === "blocked" ? (
                        <Link
                          to={`/app/clients/${r.client.id}`}
                          className="expected-payouts-page__create-link"
                        >
                          Complete Checklist
                        </Link>
                      ) : (
                        <Link
                          to={`/app/vouchers/new?client=${r.client.id}&tranche=${r.trancheNumber}&role=${encodeURIComponent(r.breakdown.role)}`}
                          className="expected-payouts-page__create-link"
                        >
                          Create Voucher
                        </Link>
                      )}
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
