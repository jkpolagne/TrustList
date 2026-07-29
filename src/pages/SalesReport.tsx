import { BarChart3, Download, ListChecks, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BarList, type BarListItem } from "../components/BarList";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { getClientsByFirm, getConsultantsByFirm, getDevelopersByFirm, getPropertiesByFirm } from "../services";
import type { Client, Consultant, Developer, Property } from "../types";
import { downloadCsv } from "../utils/csv";
import { formatRangeLabel, getPresetRange, type DateRange, type DateRangePreset } from "../utils/dateRange";
import { formatPHP } from "../utils/finance";
import {
  getSalesByConsultant,
  getSalesByPaymentMethod,
  getSalesByPropertyType,
  getSalesBySaleType,
  getTopProperties,
  sumContractPrice,
} from "../utils/salesAnalytics";
import "./SalesReport.css";

export function SalesReport() {
  const { session } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);

  const [preset, setPreset] = useState<DateRangePreset>("This Year");
  const [range, setRange] = useState<DateRange>(() => getPresetRange("This Year"));
  const [developerFilter, setDeveloperFilter] = useState("All");

  useEffect(() => {
    if (!session?.firmId) return;
    Promise.all([
      getClientsByFirm(session.firmId),
      getPropertiesByFirm(session.firmId),
      getDevelopersByFirm(session.firmId),
      getConsultantsByFirm(session.firmId),
    ]).then(([clientsData, propertiesData, developersData, consultantsData]) => {
      setClients(clientsData);
      setProperties(propertiesData);
      setDevelopers(developersData);
      setConsultants(consultantsData);
      setLoading(false);
    });
  }, [session?.firmId]);

  const propertiesById = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);
  const developersById = useMemo(() => new Map(developers.map((d) => [d.id, d])), [developers]);
  const consultantsById = useMemo(() => new Map(consultants.map((c) => [c.id, c])), [consultants]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const d = c.reservationDate.slice(0, 10);
      if (d < range.start || d > range.end) return false;
      if (developerFilter !== "All") {
        const property = propertiesById.get(c.propertyId);
        if (property?.developerId !== developerFilter) return false;
      }
      return true;
    });
  }, [clients, range, developerFilter, propertiesById]);

  const totalValue = sumContractPrice(filteredClients);
  const averagePrice = filteredClients.length > 0 ? totalValue / filteredClients.length : 0;

  const byPropertyType = useMemo(() => getSalesByPropertyType(filteredClients, properties), [filteredClients, properties]);
  const byPaymentMethod = useMemo(() => getSalesByPaymentMethod(filteredClients), [filteredClients]);
  const bySaleType = useMemo(() => getSalesBySaleType(filteredClients), [filteredClients]);
  const topProperties = useMemo(() => getTopProperties(filteredClients, properties, 5), [filteredClients, properties]);
  const topConsultants = useMemo(
    () =>
      getSalesByConsultant(filteredClients, filteredClients, consultants)
        .filter((r) => r.salesCount > 0)
        .slice(0, 5),
    [filteredClients, consultants],
  );

  function handleDownload() {
    const rows = filteredClients.map((c) => {
      const property = propertiesById.get(c.propertyId);
      const developer = property?.developerId ? developersById.get(property.developerId) : undefined;
      const consultant = consultantsById.get(c.consultantId);
      return [
        c.name,
        property?.title ?? "—",
        developer?.name ?? (property?.listingSource === "Individual Seller" ? "Individual Seller" : "—"),
        consultant?.name ?? "—",
        c.saleType,
        c.paymentMethod,
        c.contractPrice,
        c.reservationDate,
      ];
    });
    downloadCsv(
      `sales-report_${range.start}_to_${range.end}.csv`,
      ["Client", "Property", "Developer", "Consultant", "Sale Type", "Payment Method", "Contract Price", "Reservation Date"],
      rows,
    );
  }

  if (loading) {
    return (
      <div className="sales-report-page">
        <Skeleton height={28} width="30%" style={{ marginBottom: 20 }} />
        <Skeleton height={360} />
      </div>
    );
  }

  const propertyTypeBars: BarListItem[] = byPropertyType.map((row) => ({
    key: row.label,
    label: row.label,
    value: row.value,
    displayValue: `${row.count} · ${formatPHP(row.value)}`,
  }));
  const paymentMethodBars: BarListItem[] = byPaymentMethod.map((row) => ({
    key: row.label,
    label: row.label,
    value: row.value,
    displayValue: `${row.count} · ${formatPHP(row.value)}`,
  }));
  const saleTypeBars: BarListItem[] = bySaleType.map((row) => ({
    key: row.label,
    label: row.label,
    value: row.value,
    displayValue: `${row.count} · ${formatPHP(row.value)}`,
  }));
  const topPropertyBars: BarListItem[] = topProperties.map((row) => ({
    key: row.propertyId,
    label: row.title,
    value: row.salesValue,
    displayValue: formatPHP(row.salesValue),
  }));
  const topConsultantBars: BarListItem[] = topConsultants.map((row) => ({
    key: row.consultantId,
    label: row.name,
    value: row.salesValue,
    displayValue: formatPHP(row.salesValue),
  }));

  return (
    <div className="sales-report-page">
      <div className="sales-report-page__header-row">
        <header className="sales-report-page__header">
          <h1>Sales Report</h1>
          <p>Full firm sales performance, filterable by period and developer.</p>
        </header>
        <div className="sales-report-page__filters">
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
          <DateRangeFilter
            preset={preset}
            range={range}
            onChange={(nextPreset, nextRange) => {
              setPreset(nextPreset);
              setRange(nextRange);
            }}
          />
          <button type="button" className="sales-report-page__download" onClick={handleDownload}>
            <Download size={14} strokeWidth={2} aria-hidden="true" />
            Download CSV
          </button>
        </div>
      </div>

      <div className="dashboard-page__stats">
        <div className="dashboard-page__stat-card">
          <span>
            <ListChecks size={13} strokeWidth={2} aria-hidden="true" />
            Total Sales Count
          </span>
          <strong>{filteredClients.length}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>
            <Wallet size={13} strokeWidth={2} aria-hidden="true" />
            Total Sales Value
          </span>
          <strong className="money">{formatPHP(totalValue)}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>
            <TrendingUp size={13} strokeWidth={2} aria-hidden="true" />
            Average Sale Price
          </span>
          <strong className="money">{formatPHP(averagePrice)}</strong>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No sales in this range"
          description="Try widening the date range or clearing the developer filter."
        />
      ) : (
        <>
          <div className="sales-report-page__three-col">
            <section className="dashboard-page__milestones">
              <h2>By Property Type</h2>
              <BarList items={propertyTypeBars} />
            </section>
            <section className="dashboard-page__milestones">
              <h2>By Payment Method</h2>
              <BarList items={paymentMethodBars} />
            </section>
            <section className="dashboard-page__milestones">
              <h2>By Sale Type</h2>
              <BarList items={saleTypeBars} />
            </section>
          </div>

          <div className="dashboard-page__two-col">
            <section className="dashboard-page__milestones">
              <h2>Top 5 Properties</h2>
              <p className="dashboard-page__milestones-sub">By sales volume, {formatRangeLabel(range)}.</p>
              <BarList items={topPropertyBars} />
            </section>
            <section className="dashboard-page__milestones">
              <h2>Top 5 Consultants</h2>
              <p className="dashboard-page__milestones-sub">By sales volume, {formatRangeLabel(range)}.</p>
              <BarList items={topConsultantBars} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
