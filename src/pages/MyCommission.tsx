import { Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { getDevelopers, getEligibleCommissionRequests, getVouchersByConsultantIds } from "../services";
import type { Developer, Voucher } from "../types";
import { formatPHP } from "../utils/finance";
import { voucherStatusPillClass } from "../utils/voucherStatus";
import "./MyCommission.css";

export function MyCommission() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.firmId || !session.consultantId) return;
    Promise.all([
      getVouchersByConsultantIds([session.consultantId]),
      getDevelopers(),
      getEligibleCommissionRequests(session.firmId),
    ]).then(([vouchersData, developersData, eligibleData]) => {
      setVouchers(vouchersData);
      setDevelopers(developersData);
      setEligibleCount(eligibleData.filter((r) => r.breakdown.consultantId === session.consultantId).length);
      setLoading(false);
    });
  }, [session?.firmId, session?.consultantId]);

  const developersById = useMemo(() => new Map(developers.map((d) => [d.id, d])), [developers]);

  const sorted = useMemo(
    () => vouchers.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [vouchers],
  );

  const needsSignature = vouchers.filter((v) => v.status === "Pending Signature").length;
  const released = vouchers.filter((v) => v.status === "Released");
  const releasedAmount = released.reduce((sum, v) => sum + v.netCommissionReceivable, 0);

  if (loading) {
    return (
      <div className="my-commission-page">
        <Skeleton height={28} width="40%" style={{ marginBottom: 20 }} />
        <Skeleton height={360} />
      </div>
    );
  }

  return (
    <div className="my-commission-page">
      <header className="my-commission-page__header">
        <h1>My Commission</h1>
        <p>Your own commission vouchers, from Pending Signature through Released.</p>
      </header>

      <div className="my-commission-page__stats">
        <div className="my-commission-page__stat-card">
          <span>All Vouchers</span>
          <strong>{vouchers.length}</strong>
        </div>
        <div className="my-commission-page__stat-card">
          <span>Needs Signature</span>
          <strong>{needsSignature}</strong>
        </div>
        <div className="my-commission-page__stat-card">
          <span>Released</span>
          <strong>{released.length}</strong>
        </div>
        <div className="my-commission-page__stat-card">
          <span>Eligible for Processing</span>
          <strong>{eligibleCount}</strong>
        </div>
        <div className="my-commission-page__stat-card">
          <span>
            <Wallet size={13} strokeWidth={2} aria-hidden="true" />
            Released Amount
          </span>
          <strong className="money">{formatPHP(releasedAmount)}</strong>
        </div>
      </div>

      {vouchers.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No commission vouchers yet"
          description="Vouchers the broker creates for your entitled share of a reached tranche will show up here."
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Developer</th>
                <th>Release No.</th>
                <th className="data-table__numeric">Net Receivable</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((v) => (
                <tr key={v.id} data-clickable="true" onClick={() => navigate(`/app/vouchers/${v.id}`)}>
                  <td className="my-commission-page__name">{v.buyer}</td>
                  <td>{developersById.get(v.developerId)?.name ?? "—"}</td>
                  <td>{v.releaseNumber}</td>
                  <td className="data-table__numeric money">{formatPHP(v.netCommissionReceivable)}</td>
                  <td>
                    <span className={`status-pill ${voucherStatusPillClass(v.status)}`}>{v.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
