import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Wallet } from "lucide-react";
import { MilestoneStatusCard } from "../components/MilestoneStatusCard";
import { Skeleton } from "../components/Skeleton";
import { StatusCard } from "../components/StatusCard";
import { VerificationBadge } from "../components/VerificationBadge";
import { useAuth } from "../context/AuthContext";
import {
  getClientsByConsultantIds,
  getConsultantsByFirm,
  getMilestoneEventsByClientIds,
} from "../services";
import type { Client, MilestoneEvent } from "../types";
import { formatPHP } from "../utils/finance";
import { getScopedConsultantIds } from "../utils/scope";
import "./Dashboard.css";

export function Dashboard() {
  const { session } = useAuth();

  if (session?.role === "Sales Manager" || session?.role === "Sales Person") {
    return <ConsultantDashboard />;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.firmId || !session.consultantId) return;
    getConsultantsByFirm(session.firmId).then((consultantsData) => {
      const scopedIds = getScopedConsultantIds(session.consultantId!, session.role, consultantsData);
      getClientsByConsultantIds(scopedIds).then((clientsData) => {
        setClients(clientsData);
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
        <div className="dashboard-page__stat-card dashboard-page__stat-card--placeholder">
          <span>
            <Wallet size={13} strokeWidth={2} aria-hidden="true" />
            Released Commission
          </span>
          <strong>Coming in Stage 7</strong>
        </div>
      </div>

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
