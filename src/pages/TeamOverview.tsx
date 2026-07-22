import { Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { VerificationBadge } from "../components/VerificationBadge";
import { useAuth } from "../context/AuthContext";
import { getClientsByFirm, getConsultantsByFirm, getVouchersByFirm } from "../services";
import type { Client, Consultant, Voucher } from "../types";
import { formatPHP } from "../utils/finance";
import "./TeamOverview.css";

interface TeamRow {
  consultant: Consultant;
  indent: boolean;
  clientCount: number;
  activeClients: number;
  salesTotal: number;
  releasedCommission: number;
}

export function TeamOverview() {
  const { session } = useAuth();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.firmId) return;
    Promise.all([
      getConsultantsByFirm(session.firmId),
      getClientsByFirm(session.firmId),
      getVouchersByFirm(session.firmId),
    ]).then(([consultantsData, clientsData, vouchersData]) => {
      setConsultants(consultantsData);
      setClients(clientsData);
      setVouchers(vouchersData);
      setLoading(false);
    });
  }, [session?.firmId]);

  const rows = useMemo<TeamRow[]>(() => {
    function statsFor(consultant: Consultant, indent: boolean): TeamRow {
      const own = clients.filter((c) => c.consultantId === consultant.id);
      const released = vouchers.filter((v) => v.consultantId === consultant.id && v.status === "Released");
      return {
        consultant,
        indent,
        clientCount: own.length,
        activeClients: own.filter((c) => c.status === "Active").length,
        salesTotal: own.reduce((sum, c) => sum + c.contractPrice, 0),
        releasedCommission: released.reduce((sum, v) => sum + v.netCommissionReceivable, 0),
      };
    }

    const salesManagers = consultants.filter((c) => c.role === "Sales Manager");
    const result: TeamRow[] = [];
    for (const sm of salesManagers) {
      result.push(statsFor(sm, false));
      const team = consultants.filter((c) => c.reportsTo === sm.id);
      for (const sp of team) {
        result.push(statsFor(sp, true));
      }
    }
    return result;
  }, [consultants, clients, vouchers]);

  const firmTotals = useMemo(
    () => ({
      salesManagers: consultants.filter((c) => c.role === "Sales Manager").length,
      salesPersons: consultants.filter((c) => c.role === "Sales Person").length,
      salesTotal: clients.reduce((sum, c) => sum + c.contractPrice, 0),
      releasedCommission: vouchers
        .filter((v) => v.status === "Released")
        .reduce((sum, v) => sum + v.netCommissionReceivable, 0),
    }),
    [consultants, clients, vouchers],
  );

  return (
    <div className="team-overview-page">
      <header className="team-overview-page__header">
        <h1>Team Overview</h1>
        <p>Every Sales Manager and their Sales Persons, firm-wide.</p>
      </header>

      {loading ? (
        <Skeleton height={360} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="No team yet" description="Consultants added in this firm will show up here." />
      ) : (
        <>
          <div className="team-overview-page__summary">
            <div className="team-overview-page__summary-card">
              <span>Sales Managers</span>
              <strong>{firmTotals.salesManagers}</strong>
            </div>
            <div className="team-overview-page__summary-card">
              <span>Sales Persons</span>
              <strong>{firmTotals.salesPersons}</strong>
            </div>
            <div className="team-overview-page__summary-card">
              <span>Firm Sales Total</span>
              <strong className="money">{formatPHP(firmTotals.salesTotal)}</strong>
            </div>
            <div className="team-overview-page__summary-card">
              <span>Firm Released Commission</span>
              <strong className="money">{formatPHP(firmTotals.releasedCommission)}</strong>
            </div>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Consultant</th>
                  <th>PRC License</th>
                  <th className="data-table__numeric">Clients</th>
                  <th className="data-table__numeric">Active</th>
                  <th className="data-table__numeric">Sales Total</th>
                  <th className="data-table__numeric">Released Commission</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.consultant.id}>
                    <td className={row.indent ? "team-overview-page__indent" : "team-overview-page__name"}>
                      {row.indent ? "↳ " : ""}
                      {row.consultant.name}
                      <span className="team-overview-page__role"> · {row.consultant.role}</span>
                    </td>
                    <td>
                      {row.consultant.prcLicenseStatus !== "Unverified" ? (
                        <VerificationBadge
                          type="prc"
                          status={row.consultant.prcLicenseStatus === "Verified" ? "verified" : "pending"}
                          licenseNumber={row.consultant.prcLicenseNumber}
                        />
                      ) : (
                        <span className="status-pill status-pill--negative">Unverified</span>
                      )}
                    </td>
                    <td className="data-table__numeric">{row.clientCount}</td>
                    <td className="data-table__numeric">{row.activeClients}</td>
                    <td className="data-table__numeric money">{formatPHP(row.salesTotal)}</td>
                    <td className="data-table__numeric money">{formatPHP(row.releasedCommission)}</td>
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
