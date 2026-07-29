import { Download, FileSpreadsheet, Printer } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import {
  getClientsByFirm,
  getConsultantsByFirm,
  getDevelopersByFirm,
  getFirms,
  getPropertiesByFirm,
} from "../services";
import type { Client, Consultant, Developer, Firm, Property } from "../types";
import { downloadCsv } from "../utils/csv";
import { formatPHP } from "../utils/finance";
import { buildMonitoringChart, type MonitoringChartResult } from "../utils/monitoringChart";
import "./MonitoringChart.css";

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  return new Date(year, monthNum - 1, 1).toLocaleDateString("en-PH", { year: "numeric", month: "long" });
}

function buildBodyRows(chart: MonitoringChartResult): ReactNode[] {
  const rows: ReactNode[] = [];

  chart.managerGroups.forEach((sm, smIndex) => {
    const smRowCount = sm.personGroups.reduce((sum, p) => sum + p.buyers.length + 1, 0) + 1;
    const parity = smIndex % 2 === 0 ? "even" : "odd";
    let smCellRendered = false;

    for (const person of sm.personGroups) {
      let personCellRendered = false;

      for (const buyer of person.buyers) {
        rows.push(
          <tr key={buyer.clientId} data-group-parity={parity}>
            {!smCellRendered ? (
              <td rowSpan={smRowCount} className="monitoring-chart-table__sm-cell">
                {sm.name}
              </td>
            ) : null}
            {!personCellRendered ? (
              <td rowSpan={person.buyers.length + 1} className="monitoring-chart-table__sp-cell">
                {person.name}
                {person.isDirect ? <span className="monitoring-chart-table__direct-tag">Direct</span> : null}
              </td>
            ) : null}
            <td>{buyer.buyerName}</td>
            <td className="monitoring-chart-table__numeric money">{formatPHP(buyer.tcp)}</td>
            {chart.columns.map((col) => (
              <td key={col.key} className="monitoring-chart-table__numeric money">
                {buyer.amountsByColumn[col.key] === 0 ? "—" : formatPHP(buyer.amountsByColumn[col.key])}
              </td>
            ))}
            <td className="monitoring-chart-table__numeric money">{formatPHP(buyer.tcp)}</td>
          </tr>,
        );
        smCellRendered = true;
        personCellRendered = true;
      }

      rows.push(
        <tr
          key={`${person.key}-subtotal`}
          data-group-parity={parity}
          className="monitoring-chart-table__subtotal-row"
        >
          <td>Subtotal — {person.name}</td>
          <td className="monitoring-chart-table__numeric money">{formatPHP(person.subtotal)}</td>
          {chart.columns.map((col) => (
            <td key={col.key} className="monitoring-chart-table__numeric money">
              {person.subtotalByColumn[col.key] === 0 ? "—" : formatPHP(person.subtotalByColumn[col.key])}
            </td>
          ))}
          <td className="monitoring-chart-table__numeric money">{formatPHP(person.subtotal)}</td>
        </tr>,
      );
    }

    rows.push(
      <tr
        key={`${sm.consultantId}-subtotal`}
        data-group-parity={parity}
        className="monitoring-chart-table__subtotal-row monitoring-chart-table__subtotal-row--sm"
      >
        <td colSpan={3}>Subtotal — {sm.name}</td>
        <td className="monitoring-chart-table__numeric money">{formatPHP(sm.total)}</td>
        {chart.columns.map((col) => (
          <td key={col.key} className="monitoring-chart-table__numeric money">
            {sm.totalByColumn[col.key] === 0 ? "—" : formatPHP(sm.totalByColumn[col.key])}
          </td>
        ))}
        <td className="monitoring-chart-table__numeric money">{formatPHP(sm.total)}</td>
      </tr>,
    );
  });

  return rows;
}

export function MonitoringChart() {
  const { session } = useAuth();
  const [firm, setFirm] = useState<Firm | undefined>(undefined);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);

  const [month, setMonth] = useState(() => currentMonthValue());
  const [developerFilter, setDeveloperFilter] = useState("All");

  useEffect(() => {
    if (!session?.firmId) return;
    Promise.all([
      getFirms(),
      getClientsByFirm(session.firmId),
      getPropertiesByFirm(session.firmId),
      getConsultantsByFirm(session.firmId),
      getDevelopersByFirm(session.firmId),
    ]).then(([firmsData, clientsData, propertiesData, consultantsData, developersData]) => {
      setFirm(firmsData.find((f) => f.id === session.firmId));
      setClients(clientsData);
      setProperties(propertiesData);
      setConsultants(consultantsData);
      setDevelopers(developersData);
      setLoading(false);
    });
  }, [session?.firmId]);

  const chart: MonitoringChartResult = useMemo(
    () => buildMonitoringChart(clients, properties, consultants, developers, month, developerFilter),
    [clients, properties, consultants, developers, month, developerFilter],
  );

  const developerLabel =
    developerFilter === "All" ? "All Developers" : (developers.find((d) => d.id === developerFilter)?.name ?? "");

  function handleDownload() {
    const headers = ["Sales Manager", "Salesperson", "Name of Buyer", "TCP", ...chart.columns.map((c) => c.label), "Total"];
    const rows: (string | number)[][] = [];

    for (const sm of chart.managerGroups) {
      let smLabelShown = false;
      for (const person of sm.personGroups) {
        let personLabelShown = false;
        for (const buyer of person.buyers) {
          rows.push([
            smLabelShown ? "" : sm.name,
            personLabelShown ? "" : person.name,
            buyer.buyerName,
            buyer.tcp,
            ...chart.columns.map((c) => (buyer.amountsByColumn[c.key] === 0 ? "" : buyer.amountsByColumn[c.key])),
            buyer.tcp,
          ]);
          smLabelShown = true;
          personLabelShown = true;
        }
        rows.push([
          "",
          `Subtotal — ${person.name}`,
          "",
          person.subtotal,
          ...chart.columns.map((c) => (person.subtotalByColumn[c.key] === 0 ? "" : person.subtotalByColumn[c.key])),
          person.subtotal,
        ]);
      }
      rows.push([
        `Subtotal — ${sm.name}`,
        "",
        "",
        sm.total,
        ...chart.columns.map((c) => (sm.totalByColumn[c.key] === 0 ? "" : sm.totalByColumn[c.key])),
        sm.total,
      ]);
    }

    rows.push([
      "GRAND TOTAL",
      "",
      "",
      chart.grandTotal,
      ...chart.columns.map((c) => (chart.grandTotalByColumn[c.key] === 0 ? "" : chart.grandTotalByColumn[c.key])),
      chart.grandTotal,
    ]);

    downloadCsv(
      `monitoring-chart_${firm?.code ?? "firm"}_${month}${developerFilter !== "All" ? `_${developerLabel.replace(/\s+/g, "-")}` : ""}.csv`,
      headers,
      rows,
    );
  }

  if (loading) {
    return (
      <div className="monitoring-chart-page">
        <Skeleton height={28} width="40%" style={{ marginBottom: 20 }} />
        <Skeleton height={420} />
      </div>
    );
  }

  return (
    <div className="monitoring-chart-page">
      <div className="monitoring-chart-page__header-row">
        <header className="monitoring-chart-page__header">
          <h1>Monthly Monitoring Chart</h1>
          <p>
            {firm?.name ?? "Firm"} · {formatMonthLabel(month)}
            {developerFilter !== "All" ? ` · ${developerLabel}` : ""}
          </p>
        </header>
        <div className="monitoring-chart-page__filters no-print">
          <select
            aria-label="Filter by developer"
            value={developerFilter}
            onChange={(e) => setDeveloperFilter(e.target.value)}
          >
            <option value="All">All Developers</option>
            {developers.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.name}
              </option>
            ))}
          </select>
          <input
            type="month"
            aria-label="Select month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <button type="button" className="monitoring-chart-page__action" onClick={() => window.print()}>
            <Printer size={14} strokeWidth={2} aria-hidden="true" />
            Print
          </button>
          <button
            type="button"
            className="monitoring-chart-page__action monitoring-chart-page__action--primary"
            onClick={handleDownload}
          >
            <Download size={14} strokeWidth={2} aria-hidden="true" />
            Download
          </button>
        </div>
      </div>

      {chart.managerGroups.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No sales recorded this month"
          description="Try another month, or clear the developer filter."
        />
      ) : (
        <div className="monitoring-chart-table-wrap">
          <table className="monitoring-chart-table">
            <thead>
              <tr>
                <th>Sales Manager</th>
                <th>Salesperson</th>
                <th>Name of Buyer</th>
                <th className="monitoring-chart-table__numeric">TCP</th>
                {chart.columns.map((col) => (
                  <th key={col.key} className="monitoring-chart-table__numeric">
                    {col.label}
                  </th>
                ))}
                <th className="monitoring-chart-table__numeric">Total</th>
              </tr>
            </thead>
            <tbody>
              {buildBodyRows(chart)}
              <tr className="monitoring-chart-table__grand-total-row">
                <td colSpan={3}>GRAND TOTAL</td>
                <td className="monitoring-chart-table__numeric money">{formatPHP(chart.grandTotal)}</td>
                {chart.columns.map((col) => (
                  <td key={col.key} className="monitoring-chart-table__numeric money">
                    {chart.grandTotalByColumn[col.key] === 0 ? "—" : formatPHP(chart.grandTotalByColumn[col.key])}
                  </td>
                ))}
                <td className="monitoring-chart-table__numeric money">{formatPHP(chart.grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
