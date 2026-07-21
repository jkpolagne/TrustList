import { StatusCard } from "../components/StatusCard";
import { VerificationBadge } from "../components/VerificationBadge";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

export function Dashboard() {
  const { session } = useAuth();

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
