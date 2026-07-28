import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Download,
  FileCheck2,
  Home,
  Inbox,
  ShieldQuestion,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AwaitingPayoutCard } from "../components/AwaitingPayoutCard";
import { BarList, type BarListItem } from "../components/BarList";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { MilestoneStatusCard } from "../components/MilestoneStatusCard";
import { Skeleton } from "../components/Skeleton";
import { StatusCard } from "../components/StatusCard";
import { VerificationBadge } from "../components/VerificationBadge";
import { useAuth } from "../context/AuthContext";
import {
  getClientsByConsultantIds,
  getClientsByFirm,
  getConsultantsByFirm,
  getDevelopersByFirm,
  getEligibleCommissionRequests,
  getMilestoneEventsByClientIds,
  getMilestoneEventsByFirm,
  getPendingVerificationByFirm,
  getPropertiesByFirm,
  getSellerInquiriesByFirm,
  getVisitRequestsByFirm,
  getVouchersByConsultantIds,
  getVouchersByFirm,
  type EligibleCommissionRequest,
} from "../services";
import type {
  Client,
  Consultant,
  Developer,
  MilestoneEvent,
  Property,
  SellerInquiry,
  VisitRequest,
  Voucher,
} from "../types";
import { downloadCsv } from "../utils/csv";
import { formatRangeLabel, getPresetRange, type DateRange, type DateRangePreset } from "../utils/dateRange";
import { formatPHP } from "../utils/finance";
import {
  filterClientsByRange,
  getAgingDistribution,
  getCommissionSummary,
  getMonthlyTrend,
  getMonthOverMonthSales,
  getReleasedVsPendingThisMonth,
  getSalesByConsultant,
  getSalesByDeveloper,
  getTeamPerformanceByManager,
  sumContractPrice,
} from "../utils/salesAnalytics";
import { getScopedConsultantIds } from "../utils/scope";
import { voucherStatusPillClass } from "../utils/voucherStatus";
import "./Dashboard.css";

export function Dashboard() {
  const { session } = useAuth();

  if (session?.role === "Company Admin") {
    return <CompanyAdminDashboard />;
  }

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

function CompanyAdminDashboard() {
  const { session } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [sellerInquiries, setSellerInquiries] = useState<SellerInquiry[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [preset, setPreset] = useState<DateRangePreset>("This Month");
  const [range, setRange] = useState<DateRange>(() => getPresetRange("This Month"));

  useEffect(() => {
    if (!session?.firmId) return;
    Promise.all([
      getPropertiesByFirm(session.firmId),
      getConsultantsByFirm(session.firmId),
      getClientsByFirm(session.firmId),
      getDevelopersByFirm(session.firmId),
      getVisitRequestsByFirm(session.firmId),
      getSellerInquiriesByFirm(session.firmId),
      getPendingVerificationByFirm(session.firmId),
    ]).then(
      ([propertiesData, consultantsData, clientsData, developersData, visitsData, inquiriesData, pendingVerData]) => {
        setProperties(propertiesData);
        setConsultants(consultantsData);
        setClients(clientsData);
        setDevelopers(developersData);
        setVisits(visitsData);
        setSellerInquiries(inquiriesData);
        setPendingVerifications(pendingVerData);
        setLoading(false);
      },
    );
  }, [session?.firmId]);

  const rangedClients = useMemo(() => filterClientsByRange(clients, range), [clients, range]);
  const salesByDeveloper = useMemo(
    () => getSalesByDeveloper(rangedClients, properties, developers),
    [rangedClients, properties, developers],
  );
  const salesByConsultant = useMemo(
    () => getSalesByConsultant(clients, rangedClients, consultants),
    [clients, rangedClients, consultants],
  );
  const topConsultants = salesByConsultant.filter((r) => r.salesCount > 0).slice(0, 5);
  const salesValueInRange = sumContractPrice(rangedClients);

  const activeConsultants = consultants.filter((c) => c.accountStatus === "Active").length;
  const pendingVisits = visits.filter((v) => v.status === "Pending").length;
  const pendingInquiries = sellerInquiries.filter((i) => i.status === "New" || i.status === "Contacted").length;

  function handleDownload() {
    downloadCsv(
      `sales-by-consultant_${range.start}_to_${range.end}.csv`,
      ["Consultant", "Role", "Lifetime Clients", "Sales Count (Range)", "Sales Value (Range)"],
      salesByConsultant.map((r) => [r.name, r.role, r.lifetimeClients, r.salesCount, r.salesValue]),
    );
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <Skeleton height={28} width="40%" style={{ marginBottom: 20 }} />
        <Skeleton height={360} />
      </div>
    );
  }

  const developerBars: BarListItem[] = salesByDeveloper.map((row) => ({
    key: row.developerId,
    label: row.developerName,
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
    <div className="dashboard-page">
      <div className="dashboard-page__header-row">
        <header className="dashboard-page__header">
          <h1>Welcome, {session?.displayName}</h1>
          <p>Firm-wide operations across properties, consultants, and sales.</p>
        </header>
        <DateRangeFilter
          preset={preset}
          range={range}
          onChange={(nextPreset, nextRange) => {
            setPreset(nextPreset);
            setRange(nextRange);
          }}
        />
      </div>

      <div className="dashboard-page__stats">
        <div className="dashboard-page__stat-card">
          <span>
            <Home size={13} strokeWidth={2} aria-hidden="true" />
            Total Properties Listed
          </span>
          <strong>{properties.length}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>
            <Users size={13} strokeWidth={2} aria-hidden="true" />
            Active Consultants
          </span>
          <strong>{activeConsultants}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>Clients ({formatRangeLabel(range)})</span>
          <strong>{rangedClients.length}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>
            <Wallet size={13} strokeWidth={2} aria-hidden="true" />
            Sales Value ({formatRangeLabel(range)})
          </span>
          <strong className="money">{formatPHP(salesValueInRange)}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>
            <CalendarClock size={13} strokeWidth={2} aria-hidden="true" />
            Pending Visit Requests
          </span>
          <strong>{pendingVisits}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>
            <Inbox size={13} strokeWidth={2} aria-hidden="true" />
            Pending Seller Inquiries
          </span>
          <strong>{pendingInquiries}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>
            <ShieldQuestion size={13} strokeWidth={2} aria-hidden="true" />
            Pending Listing Verifications
          </span>
          <strong>{pendingVerifications.length}</strong>
        </div>
      </div>

      <div className="dashboard-page__two-col">
        <section className="dashboard-page__milestones">
          <h2>Sales by Developer</h2>
          <p className="dashboard-page__milestones-sub">{formatRangeLabel(range)}</p>
          <BarList items={developerBars} emptyLabel="No sales recorded in this range." />
        </section>

        <section className="dashboard-page__milestones">
          <h2>Top Performing Consultants</h2>
          <p className="dashboard-page__milestones-sub">{formatRangeLabel(range)}</p>
          <BarList items={topConsultantBars} emptyLabel="No sales recorded in this range." />
        </section>
      </div>

      <section className="dashboard-page__milestones">
        <div className="dashboard-page__section-header">
          <div>
            <h2>Sales by Consultant</h2>
            <p className="dashboard-page__milestones-sub">
              Lifetime clients vs. sales within {formatRangeLabel(range)}.
            </p>
          </div>
          <button type="button" className="dashboard-page__download" onClick={handleDownload}>
            <Download size={14} strokeWidth={2} aria-hidden="true" />
            Download Report (CSV)
          </button>
        </div>
        {salesByConsultant.length === 0 ? (
          <StatusCard accent="neutral">
            <div className="dashboard-page__no-milestones">
              <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
              No consultants on record yet.
            </div>
          </StatusCard>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Consultant</th>
                  <th>Role</th>
                  <th className="data-table__numeric">Lifetime Clients</th>
                  <th className="data-table__numeric">Sales Count</th>
                  <th className="data-table__numeric">Sales Value</th>
                </tr>
              </thead>
              <tbody>
                {salesByConsultant.map((row) => (
                  <tr key={row.consultantId}>
                    <td>{row.name}</td>
                    <td>{row.role}</td>
                    <td className="data-table__numeric">{row.lifetimeClients}</td>
                    <td className="data-table__numeric">{row.salesCount === 0 ? "—" : row.salesCount}</td>
                    <td className="data-table__numeric money">
                      {row.salesValue === 0 ? "—" : formatPHP(row.salesValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function ConsultantDashboard() {
  const { session } = useAuth();
  const [allConsultants, setAllConsultants] = useState<Consultant[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [milestones, setMilestones] = useState<MilestoneEvent[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [awaitingPayouts, setAwaitingPayouts] = useState<EligibleCommissionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.firmId || !session.consultantId) return;
    getConsultantsByFirm(session.firmId).then((consultantsData) => {
      setAllConsultants(consultantsData);
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

  const isManager = session?.role === "Sales Manager";

  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const pendingMilestones = useMemo(
    () =>
      milestones
        .filter((m) => m.voucherStatus === "Pending")
        .sort((a, b) => new Date(a.detectedDate).getTime() - new Date(b.detectedDate).getTime()),
    [milestones],
  );

  const directClients = useMemo(
    () => clients.filter((c) => c.consultantId === session?.consultantId),
    [clients, session?.consultantId],
  );
  const teamSPs = useMemo(
    () =>
      isManager
        ? allConsultants.filter((c) => c.role === "Sales Person" && c.reportsTo === session?.consultantId)
        : [],
    [isManager, allConsultants, session?.consultantId],
  );
  const teamClients = useMemo(
    () => clients.filter((c) => teamSPs.some((sp) => sp.id === c.consultantId)),
    [clients, teamSPs],
  );
  const teamRanking = useMemo(
    () =>
      teamSPs
        .map((sp) => {
          const spClients = clients.filter((c) => c.consultantId === sp.id);
          const spVouchers = vouchers.filter((v) => v.consultantId === sp.id);
          return {
            consultantId: sp.id,
            name: sp.name,
            clientCount: spClients.length,
            salesValue: sumContractPrice(spClients),
            commissionReleased: spVouchers
              .filter((v) => v.status === "Released")
              .reduce((sum, v) => sum + v.netCommissionReceivable, 0),
          };
        })
        .sort((a, b) => b.salesValue - a.salesValue),
    [teamSPs, clients, vouchers],
  );

  const eligibleValue = awaitingPayouts.reduce((sum, r) => sum + r.breakdown.netCommissionReceivable, 0);
  const commissionSummary = useMemo(() => getCommissionSummary(vouchers, eligibleValue), [vouchers, eligibleValue]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(clients, vouchers, 6), [clients, vouchers]);

  const activeClients = clients.filter((c) => c.status === "Active").length;

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
        <p>{isManager ? "A snapshot of your own clients and your team's." : "A snapshot of your clients."}</p>
      </header>

      <div className="dashboard-page__stats">
        <div className="dashboard-page__stat-card">
          <span>{isManager ? "My Direct Clients" : "My Clients"}</span>
          <strong>{isManager ? directClients.length : clients.length}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>{isManager ? "My Direct Sales Value" : "My Sales Value"}</span>
          <strong className="money">
            {formatPHP(sumContractPrice(isManager ? directClients : clients))}
          </strong>
        </div>
        {isManager ? (
          <>
            <div className="dashboard-page__stat-card">
              <span>
                <Users size={13} strokeWidth={2} aria-hidden="true" />
                My Team's Clients
              </span>
              <strong>{teamClients.length}</strong>
            </div>
            <div className="dashboard-page__stat-card">
              <span>My Team's Sales Value</span>
              <strong className="money">{formatPHP(sumContractPrice(teamClients))}</strong>
            </div>
          </>
        ) : null}
        <div className="dashboard-page__stat-card">
          <span>Active Clients</span>
          <strong>{activeClients}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>
            <Wallet size={13} strokeWidth={2} aria-hidden="true" />
            Commission Released
          </span>
          <strong className="money">{formatPHP(commissionSummary.released)}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>Commission Pending</span>
          <strong className="money">{formatPHP(commissionSummary.pending)}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>Commission Eligible</span>
          <strong className="money">{formatPHP(commissionSummary.eligible)}</strong>
        </div>
      </div>

      {isManager ? (
        <section className="dashboard-page__milestones">
          <h2>My Team Ranking</h2>
          <p className="dashboard-page__milestones-sub">
            Sales Persons reporting to you, ranked by lifetime sales value.
          </p>
          {teamRanking.length === 0 ? (
            <StatusCard accent="neutral">
              <div className="dashboard-page__no-milestones">
                <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
                No Sales Persons report to you yet.
              </div>
            </StatusCard>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sales Person</th>
                    <th className="data-table__numeric">Clients</th>
                    <th className="data-table__numeric">Sales Value</th>
                    <th className="data-table__numeric">Commission Released</th>
                  </tr>
                </thead>
                <tbody>
                  {teamRanking.map((row) => (
                    <tr key={row.consultantId}>
                      <td>{row.name}</td>
                      <td className="data-table__numeric">{row.clientCount === 0 ? "—" : row.clientCount}</td>
                      <td className="data-table__numeric money">
                        {row.salesValue === 0 ? "—" : formatPHP(row.salesValue)}
                      </td>
                      <td className="data-table__numeric money">
                        {row.commissionReleased === 0 ? "—" : formatPHP(row.commissionReleased)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <section className="dashboard-page__milestones">
        <h2>Monthly Performance Trend</h2>
        <p className="dashboard-page__milestones-sub">Last 6 months.</p>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th className="data-table__numeric">Clients Added</th>
                <th className="data-table__numeric">Sales Closed</th>
                <th className="data-table__numeric">Commission Released</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTrend.map((row) => (
                <tr key={row.monthLabel}>
                  <td>{row.monthLabel}</td>
                  <td className="data-table__numeric">{row.clientsAdded === 0 ? "—" : row.clientsAdded}</td>
                  <td className="data-table__numeric">{row.salesClosed === 0 ? "—" : row.salesClosed}</td>
                  <td className="data-table__numeric money">
                    {row.commissionReleased === 0 ? "—" : formatPHP(row.commissionReleased)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
  const [milestones, setMilestones] = useState<MilestoneEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.firmId) return;
    Promise.all([
      getConsultantsByFirm(session.firmId),
      getClientsByFirm(session.firmId),
      getVouchersByFirm(session.firmId),
      getEligibleCommissionRequests(session.firmId),
      getMilestoneEventsByFirm(session.firmId),
    ]).then(([consultantsData, clientsData, vouchersData, eligibleData, milestonesData]) => {
      setConsultants(consultantsData);
      setClients(clientsData);
      setVouchers(vouchersData);
      setEligible(eligibleData);
      setMilestones(milestonesData);
      setLoading(false);
    });
  }, [session?.firmId]);

  const consultantsById = useMemo(() => new Map(consultants.map((c) => [c.id, c])), [consultants]);
  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const pendingMilestones = useMemo(
    () =>
      milestones
        .filter((m) => m.voucherStatus === "Pending")
        .sort((a, b) => new Date(a.detectedDate).getTime() - new Date(b.detectedDate).getTime()),
    [milestones],
  );

  const totalSMs = consultants.filter((c) => c.role === "Sales Manager").length;
  const totalSPs = consultants.filter((c) => c.role === "Sales Person").length;

  const now = new Date();
  const monthOverMonth = useMemo(() => getMonthOverMonthSales(clients, now), [clients]);
  const releasedVsPending = useMemo(() => getReleasedVsPendingThisMonth(vouchers, now), [vouchers]);
  const agingDistribution = useMemo(() => getAgingDistribution(eligible), [eligible]);
  const teamPerformance = useMemo(
    () =>
      getTeamPerformanceByManager(
        consultants.filter((c) => c.role === "Sales Manager"),
        consultants,
        clients,
        vouchers,
      ),
    [consultants, clients, vouchers],
  );

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

  const agingBars: BarListItem[] = agingDistribution.map((bucket) => ({
    key: bucket.tier,
    label: bucket.label,
    value: bucket.count,
    displayValue: `${bucket.count} · ${formatPHP(bucket.value)}`,
    color: `var(--color-${bucket.tier === "fresh" ? "gold" : bucket.tier})`,
  }));

  const TrendIcon =
    monthOverMonth.deltaPercent !== null && monthOverMonth.deltaPercent < 0 ? TrendingDown : TrendingUp;
  const trendClass =
    monthOverMonth.deltaPercent === null
      ? "dashboard-page__trend--neutral"
      : monthOverMonth.deltaPercent < 0
        ? "dashboard-page__trend--down"
        : "dashboard-page__trend--up";

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
          <span>Sales This Month</span>
          <strong className="money">{formatPHP(monthOverMonth.thisMonthValue)}</strong>
          {monthOverMonth.deltaPercent !== null ? (
            <span className={`dashboard-page__trend ${trendClass}`}>
              <TrendIcon size={12} strokeWidth={2.5} aria-hidden="true" />
              {Math.abs(monthOverMonth.deltaPercent).toFixed(0)}% vs last month
            </span>
          ) : (
            <span className="dashboard-page__trend dashboard-page__trend--neutral">No sales last month</span>
          )}
        </div>
        <div className="dashboard-page__stat-card">
          <span>
            <Wallet size={13} strokeWidth={2} aria-hidden="true" />
            Commission Released This Month
          </span>
          <strong className="money">{formatPHP(releasedVsPending.releasedValue)}</strong>
        </div>
        <div className="dashboard-page__stat-card">
          <span>Commission Pending</span>
          <strong className="money">{formatPHP(releasedVsPending.pendingValue)}</strong>
        </div>
      </div>

      <section className="dashboard-page__milestones">
        <h2>Releasable Commission Aging</h2>
        <p className="dashboard-page__milestones-sub">
          How long each eligible tranche has sat without a voucher.
        </p>
        <BarList items={agingBars} emptyLabel="Nothing awaiting payout right now." />
      </section>

      <section className="dashboard-page__milestones">
        <h2>Team Performance</h2>
        <p className="dashboard-page__milestones-sub">Per Sales Manager, including their team's Sales Persons.</p>
        {teamPerformance.length === 0 ? (
          <StatusCard accent="neutral">
            <div className="dashboard-page__no-milestones">
              <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
              No Sales Managers on record yet.
            </div>
          </StatusCard>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sales Manager</th>
                  <th className="data-table__numeric">Clients</th>
                  <th className="data-table__numeric">Sales</th>
                  <th className="data-table__numeric">Released</th>
                  <th className="data-table__numeric">Pending</th>
                </tr>
              </thead>
              <tbody>
                {teamPerformance.map((row) => (
                  <tr key={row.consultantId}>
                    <td>{row.name}</td>
                    <td className="data-table__numeric">{row.clientCount === 0 ? "—" : row.clientCount}</td>
                    <td className="data-table__numeric money">
                      {row.salesValue === 0 ? "—" : formatPHP(row.salesValue)}
                    </td>
                    <td className="data-table__numeric money">
                      {row.releasedValue === 0 ? "—" : formatPHP(row.releasedValue)}
                    </td>
                    <td className="data-table__numeric money">
                      {row.pendingValue === 0 ? "—" : formatPHP(row.pendingValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
        <h2>Milestone Visibility</h2>
        <p className="dashboard-page__milestones-sub">
          Every tranche reached firm-wide, the moment the system detects it — including sales
          with no developer-commission structure to compute a payout against yet.
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
              />
            ))}
          </div>
        )}
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
