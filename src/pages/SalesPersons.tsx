import { Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { VerificationBadge } from "../components/VerificationBadge";
import { useAuth } from "../context/AuthContext";
import { getClientsByConsultantIds, getConsultantsByFirm } from "../services";
import type { Client, Consultant } from "../types";
import { formatPHP } from "../utils/finance";
import "./SalesPersons.css";

export function SalesPersons() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Consultant[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.firmId || !session.consultantId) return;
    getConsultantsByFirm(session.firmId).then((consultants) => {
      const teamMembers = consultants.filter((c) => c.reportsTo === session.consultantId);
      setTeam(teamMembers);
      getClientsByConsultantIds(teamMembers.map((c) => c.id)).then((clientsData) => {
        setClients(clientsData);
        setLoading(false);
      });
    });
  }, [session?.firmId, session?.consultantId]);

  const rows = useMemo(
    () =>
      team.map((sp) => {
        const spClients = clients.filter((c) => c.consultantId === sp.id);
        const activeClients = spClients.filter((c) => c.status === "Active");
        const salesTotal = spClients.reduce((sum, c) => sum + c.contractPrice, 0);
        return { sp, totalClients: spClients.length, activeClients: activeClients.length, salesTotal };
      }),
    [team, clients],
  );

  const teamTotals = useMemo(
    () => ({
      totalClients: clients.length,
      activeClients: clients.filter((c) => c.status === "Active").length,
      salesTotal: clients.reduce((sum, c) => sum + c.contractPrice, 0),
    }),
    [clients],
  );

  return (
    <div className="sales-persons-page">
      <header className="sales-persons-page__header">
        <h1>Sales Persons</h1>
        <p>Your team roster and their client load.</p>
      </header>

      {loading ? (
        <Skeleton height={320} />
      ) : team.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Sales Persons yet"
          description="Sales Persons you add under yourself in Consultant Accounts will show up here."
        />
      ) : (
        <>
          <div className="sales-persons-page__summary">
            <div className="sales-persons-page__summary-card">
              <span>Team Clients</span>
              <strong>{teamTotals.totalClients}</strong>
            </div>
            <div className="sales-persons-page__summary-card">
              <span>Active Clients</span>
              <strong>{teamTotals.activeClients}</strong>
            </div>
            <div className="sales-persons-page__summary-card">
              <span>Team Sales Total</span>
              <strong className="money">{formatPHP(teamTotals.salesTotal)}</strong>
            </div>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sales Person</th>
                  <th>PRC License</th>
                  <th className="data-table__numeric">Total Clients</th>
                  <th className="data-table__numeric">Active Clients</th>
                  <th className="data-table__numeric">Sales Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ sp, totalClients, activeClients, salesTotal }) => (
                  <tr key={sp.id}>
                    <td className="sales-persons-page__name">{sp.name}</td>
                    <td>
                      {sp.prcLicenseStatus !== "Unverified" ? (
                        <VerificationBadge
                          type="prc"
                          status={sp.prcLicenseStatus === "Verified" ? "verified" : "pending"}
                          licenseNumber={sp.prcLicenseNumber}
                        />
                      ) : (
                        <span className="status-pill status-pill--negative">Unverified</span>
                      )}
                    </td>
                    <td className="data-table__numeric">{totalClients}</td>
                    <td className="data-table__numeric">{activeClients}</td>
                    <td className="data-table__numeric money">{formatPHP(salesTotal)}</td>
                    <td>
                      <button
                        type="button"
                        className="sales-persons-page__drilldown"
                        onClick={() => navigate(`/app/clients?consultant=${sp.id}`)}
                        disabled={totalClients === 0}
                      >
                        View Clients
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
