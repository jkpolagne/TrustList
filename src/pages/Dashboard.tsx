import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileCheck2, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { AwaitingPayoutCard } from "../components/AwaitingPayoutCard";
import { MilestoneStatusCard } from "../components/MilestoneStatusCard";
import { Skeleton } from "../components/Skeleton";
import { StatusCard } from "../components/StatusCard";
import { VerificationBadge } from "../components/VerificationBadge";
import { useAuth } from "../context/AuthContext";
import {
  getClientsByConsultantIds,
  getClientsByFirm,
  getConsultantsByFirm,
  getEligibleCommissionRequests,
  getMilestoneEventsByClientIds,
  getVouchersByConsultantIds,
  getVouchersByFirm,
  type EligibleCommissionRequest,
} from "../services";
import type { Client, Consultant, MilestoneEvent, Voucher } from "../types";
import { formatPHP } from "../utils/finance";
import { getScopedConsultantIds } from "../utils/scope";
import { voucherStatusPillClass } from "../utils/voucherStatus";
import "./Dashboard.css";

export function Dashboard() {
  const { session } = useAuth();

  if (session?.role === "Sales Manager" || session?.role === "Sales Person") {
    return <ConsultantDashboard />;
  }

  if (session?.role === "Broker") {
    return <BrokerDashboard />;
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <h1>Welcome, {session?.displayName}</h1>
        <p>
          Signed in as <strong>{session?.role}</strong>. Module dashboards for this role are
          built in the next stages — this is the shared shell they will render inside.
        </p>
      </header>

      <div className="dashboard-page__grid">
        <StatusCard
          accent="gold"
          title="Stage 1 scaffold"
          subtitle="Shared components, mock data, and service layer are wired up."
        >
          <p className="dashboard-page__note">
            Sidebar navigation above lists this role's upcoming modules — items marked
            "Soon" arrive in later build stages.
          </p>
        </StatusCard>

        <StatusCard accent="green" title="Trust badges preview">
          <div className="dashboard-page__badges">
            <VerificationBadge type="prc" status="verified" licenseNumber="0034521" />
            <VerificationBadge type="prc" status="pending" />
            <VerificationBadge type="ownership" status="verified" />
            <VerificationBadge type="ownership" status="pending" />
          </div>
        </StatusCard>
      </div>
    </div>
  );
}

function ConsultantDashboard() {
  const { session } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [milestones, setMilestones] = useState<MilestoneEvent[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [awaitingPayouts, setAwaitingPayouts] = useState<EligibleCommissionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.firmId || !session.consultantId) return;
    getConsultantsByFirm(session.firmId).then((consultantsData) => {
      const scopedIds = getScopedConsultantIds(session.consultantId!, session.role, consultantsData);
      Promise.all([
        getClientsByConsultantIds(scopedIds),
        getVouchersByConsultantIds(scopedIds),
        getEligibleCommissionRequests(session.firmId!),
      ]).then(([clientsData, vouchersData, eligibleData]) => {
        setClients(clientsData);
        setVouchers(vouchersData);
        setAwaitingPayouts(eligibleData.filter((r) => scopedIds.includes(r.breakdown.consultantId)));
        getMilestoneEventsByClientIds(clientsData.map((c) => c.id)).then((milestonesData) => {
          setMilestones(milestonesData);
          setLoading(false);
        });
      });
    });
  }, [session?.firmId, session?.consultantId, session?.role]);

  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const pendingMilestones = useMemo(
    () =>
      milestones
        .filter((m) => m.voucherStatus === "Pending")
        .sort((a, b) => new Date(a.detectedDate).getTime() - new Date(b.detectedDate).getTime()),
    [milestones],
  );

  const activeClients = clients.filter((c) => c.status === "Active").length;
  const salesTotal = clients.reduce((sum, c) => sum + c.contractPrice, 0);
  const releasedCommission = vouchers
    .filter((v) => v.status === "Released")
    .reduce((sum, v) => sum + v.netCommissionReceivable, 0);

  if (loading) {
    return (
      <div className="dashboard-page">
        <Skeleton height={28} width="40%" style={{ marginBottom: 20 }} />
        <Skeleton height={280} />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <h1>Welcome, {session?.displayName}</h1>
        <p>
          {session?.role === "Sales Manager"
            ? "A snapshot of your own clients and your team's."
            : "A snapshot of your clients."}
        </p>
      </header>

      <div className="dashboard-page__stats">
        <div className="dashboard-page__stat-card">
          <span>Total Clients</span>
          <strong>{clients.length}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>Active Clients</span>
          <strong>{activeClients}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>Sales Amount</span>
          <strong className="money">{formatPHP(salesTotal)}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>
            <Wallet size={13} strokeWidth={2} aria-hidden="true" />
            Released Commission
          </span>
          <strong className="money">{formatPHP(releasedCommission)}</strong>
        </div>
      </div>

      <section className="dashboard-page__milestones">
        <h2>Awaiting Developer Payout</h2>
        <p className="dashboard-page__milestones-sub">
          A tranche was reached and no voucher exists for it yet — this is money owed to you
          that hasn't even been paperworked, independent of anything the broker has told you.
        </p>
        {awaitingPayouts.length === 0 ? (
          <StatusCard accent="neutral">
            <div className="dashboard-page__no-milestones">
              <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
              Nothing awaiting payout right now.
            </div>
          </StatusCard>
        ) : (
          <div className="dashboard-page__milestone-list">
            {awaitingPayouts.map((request) => (
              <AwaitingPayoutCard key={`${request.milestoneEventId}-${request.breakdown.role}`} request={request} />
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-page__milestones">
        <h2>Milestone Visibility</h2>
        <p className="dashboard-page__milestones-sub">
          Reached independently of any broker action — you see this the moment the system
          detects it.
        </p>
        {pendingMilestones.length === 0 ? (
          <StatusCard accent="neutral">
            <div className="dashboard-page__no-milestones">
              <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
              No milestones awaiting voucher action right now.
            </div>
          </StatusCard>
        ) : (
          <div className="dashboard-page__milestone-list">
            {pendingMilestones.map((milestone) => (
              <MilestoneStatusCard
                key={milestone.id}
                milestone={milestone}
                clientName={clientsById.get(milestone.clientId)?.name}
                clientId={milestone.clientId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BrokerDashboard() {
  const { session } = useAuth();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [eligible, setEligible] = useState<EligibleCommissionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.firmId) return;
    Promise.all([
      getConsultantsByFirm(session.firmId),
      getClientsByFirm(session.firmId),
      getVouchersByFirm(session.firmId),
      getEligibleCommissionRequests(session.firmId),
    ]).then(([consultantsData, clientsData, vouchersData, eligibleData]) => {
      setConsultants(consultantsData);
      setClients(clientsData);
      setVouchers(vouchersData);
      setEligible(eligibleData);
      setLoading(false);
    });
  }, [session?.firmId]);

  const consultantsById = useMemo(() => new Map(consultants.map((c) => [c.id, c])), [consultants]);

  const totalSMs = consultants.filter((c) => c.role === "Sales Manager").length;
  const totalSPs = consultants.filter((c) => c.role === "Sales Person").length;

  const now = new Date();
  const releasedThisMonth = vouchers
    .filter((v) => {
      if (v.status !== "Released" || !v.dateDisbursed) return false;
      const d = new Date(v.dateDisbursed);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, v) => sum + v.netCommissionReceivable, 0);

  const releasable = vouchers
    .filter((v) => v.status === "Signed" || v.status === "Check Ready")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const teamRows = consultants
    .filter((c) => c.role === "Sales Manager" || c.role === "Sales Person")
    .map((c) => ({
      consultant: c,
      clientCount: clients.filter((cl) => cl.consultantId === c.id).length,
    }));

  if (loading) {
    return (
      <div className="dashboard-page">
        <Skeleton height={28} width="40%" style={{ marginBottom: 20 }} />
        <Skeleton height={320} />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <h1>Welcome, {session?.displayName}</h1>
        <p>Commission oversight across your firm's Sales Managers and Sales Persons.</p>
      </header>

      <div className="dashboard-page__stats">
        <div className="dashboard-page__stat-card">
          <span>Sales Managers</span>
          <strong>{totalSMs}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>Sales Persons</span>
          <strong>{totalSPs}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>
            <FileCheck2 size={13} strokeWidth={2} aria-hidden="true" />
            Eligible Commission Requests
          </span>
          <strong>{eligible.length}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>
            <Wallet size={13} strokeWidth={2} aria-hidden="true" />
            Released This Month
          </span>
          <strong className="money">{formatPHP(releasedThisMonth)}</strong>
        </div>
      </div>

      <section className="dashboard-page__milestones">
        <h2>Awaiting Developer Payout</h2>
        <p className="dashboard-page__milestones-sub">
          Tranches reached firm-wide with no voucher created yet — the anti-"walang
          transmittal" list. Aging turns amber past 7 days, red past 14.
        </p>
        {eligible.length === 0 ? (
          <StatusCard accent="neutral">
            <div className="dashboard-page__no-milestones">
              <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
              Nothing awaiting payout right now.
            </div>
          </StatusCard>
        ) : (
          <div className="dashboard-page__milestone-list">
            {eligible.slice(0, 6).map((request) => (
              <AwaitingPayoutCard
                key={`${request.milestoneEventId}-${request.breakdown.role}`}
                request={request}
                showRecipient
                consultantName={consultantsById.get(request.breakdown.consultantId)?.name}
                linkTo={`/app/vouchers/new?client=${request.client.id}&tranche=${request.trancheNumber}&role=${encodeURIComponent(request.breakdown.role)}`}
              />
            ))}
          </div>
        )}
        {eligible.length > 6 ? (
          <Link to="/app/payouts" className="dashboard-page__view-all">
            View all {eligible.length} awaiting payouts →
          </Link>
        ) : null}
      </section>

      <section className="dashboard-page__milestones">
        <h2>Releasable Commissions</h2>
        <p className="dashboard-page__milestones-sub">
          Signed vouchers ready for check preparation, and Check Ready vouchers ready to
          release.
        </p>
        {releasable.length === 0 ? (
          <StatusCard accent="neutral">
            <div className="dashboard-page__no-milestones">
              <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
              No vouchers need check prep or release right now.
            </div>
          </StatusCard>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Paid To</th>
                  <th>Role</th>
                  <th>Release No.</th>
                  <th className="data-table__numeric">Net Receivable</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {releasable.map((v) => (
                  <tr key={v.id} data-clickable="true">
                    <td>
                      <Link to={`/app/vouchers/${v.id}`}>{v.buyer}</Link>
                    </td>
                    <td>{v.paidTo}</td>
                    <td>{v.role}</td>
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
      </section>

      <section className="dashboard-page__milestones">
        <h2>Team Overview</h2>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Consultant</th>
                <th>Role</th>
                <th className="data-table__numeric">Clients</th>
              </tr>
            </thead>
            <tbody>
              {teamRows.map(({ consultant, clientCount }) => (
                <tr key={consultant.id}>
                  <td>{consultant.name}</td>
                  <td>{consultant.role}</td>
                  <td className="data-table__numeric">{clientCount === 0 ? "—" : clientCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link to="/app/team-overview" className="dashboard-page__view-all">
          View full team overview →
        </Link>
      </section>
    </div>
  );
}
