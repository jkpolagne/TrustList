import type { Client, Consultant, ConsultantRole, Developer, PaymentMethod, Property, SaleType, Voucher } from "../types";
import { getPayoutAgingTier, type PayoutAgingTier } from "./milestones";
import { isWithinRange, type DateRange } from "./dateRange";
import type { EligibleCommissionRequest } from "../services";

/** Every Client record is treated as one sale — reservationDate is the sale date,
 * contractPrice the sale value. This is the shared basis every report below sums. */
export function filterClientsByRange(clients: Client[], range: DateRange): Client[] {
  return clients.filter((c) => isWithinRange(c.reservationDate, range));
}

export function sumContractPrice(clients: Client[]): number {
  return clients.reduce((sum, c) => sum + c.contractPrice, 0);
}

export interface DeveloperSalesRow {
  developerId: string;
  developerName: string;
  salesCount: number;
  salesValue: number;
}

const NO_DEVELOPER_ID = "__individual-seller__";

/** Individual Seller sales have no developerId — bucketed separately rather than
 * silently dropped, since that money is still real firm revenue. */
export function getSalesByDeveloper(
  clients: Client[],
  properties: Property[],
  developers: Developer[],
): DeveloperSalesRow[] {
  const propertiesById = new Map(properties.map((p) => [p.id, p]));
  const developersById = new Map(developers.map((d) => [d.id, d]));
  const rows = new Map<string, DeveloperSalesRow>();

  for (const client of clients) {
    const property = propertiesById.get(client.propertyId);
    const developerId = property?.developerId ?? NO_DEVELOPER_ID;
    const developerName = property?.developerId
      ? (developersById.get(property.developerId)?.name ?? "Unknown Developer")
      : "Individual Seller";

    const existing = rows.get(developerId);
    if (existing) {
      existing.salesCount += 1;
      existing.salesValue += client.contractPrice;
    } else {
      rows.set(developerId, { developerId, developerName, salesCount: 1, salesValue: client.contractPrice });
    }
  }

  return Array.from(rows.values()).sort((a, b) => b.salesValue - a.salesValue);
}

export interface ConsultantSalesRow {
  consultantId: string;
  name: string;
  role: ConsultantRole;
  /** Lifetime clients ever assigned to this consultant — not date-filtered. */
  lifetimeClients: number;
  /** Sales (clients) whose reservationDate falls within the selected range. */
  salesCount: number;
  salesValue: number;
}

/** allClients is the unfiltered set (for lifetime client counts); rangedClients is
 * the same set already filtered to the reporting period. */
export function getSalesByConsultant(
  allClients: Client[],
  rangedClients: Client[],
  consultants: Consultant[],
): ConsultantSalesRow[] {
  return consultants
    .filter((c) => c.role === "Sales Manager" || c.role === "Sales Person")
    .map((c) => {
      const lifetime = allClients.filter((cl) => cl.consultantId === c.id);
      const ranged = rangedClients.filter((cl) => cl.consultantId === c.id);
      return {
        consultantId: c.id,
        name: c.name,
        role: c.role,
        lifetimeClients: lifetime.length,
        salesCount: ranged.length,
        salesValue: sumContractPrice(ranged),
      };
    })
    .sort((a, b) => b.salesValue - a.salesValue);
}

export interface BreakdownRow {
  label: string;
  count: number;
  value: number;
}

export function getSalesByPropertyType(clients: Client[], properties: Property[]): BreakdownRow[] {
  const propertiesById = new Map(properties.map((p) => [p.id, p]));
  let lotOnly: Client[] = [];
  let houseAndLot: Client[] = [];
  for (const client of clients) {
    const property = propertiesById.get(client.propertyId);
    if (property?.isLotOnly) lotOnly.push(client);
    else houseAndLot.push(client);
  }
  return [
    { label: "House and Lot", count: houseAndLot.length, value: sumContractPrice(houseAndLot) },
    { label: "Lot Only", count: lotOnly.length, value: sumContractPrice(lotOnly) },
  ];
}

export function getSalesByPaymentMethod(clients: Client[]): BreakdownRow[] {
  const methods: PaymentMethod[] = ["Cash", "In-House", "Bank Financing"];
  return methods.map((method) => {
    const matches = clients.filter((c) => c.paymentMethod === method);
    return { label: method, count: matches.length, value: sumContractPrice(matches) };
  });
}

export function getSalesBySaleType(clients: Client[]): BreakdownRow[] {
  const types: SaleType[] = ["Direct", "Referred"];
  return types.map((type) => {
    const matches = clients.filter((c) => c.saleType === type);
    return { label: type, count: matches.length, value: sumContractPrice(matches) };
  });
}

export interface PropertySalesRow {
  propertyId: string;
  title: string;
  salesCount: number;
  salesValue: number;
}

export function getTopProperties(clients: Client[], properties: Property[], limit = 5): PropertySalesRow[] {
  const propertiesById = new Map(properties.map((p) => [p.id, p]));
  const rows = new Map<string, PropertySalesRow>();

  for (const client of clients) {
    const property = propertiesById.get(client.propertyId);
    const title = property?.title ?? "Unknown Property";
    const existing = rows.get(client.propertyId);
    if (existing) {
      existing.salesCount += 1;
      existing.salesValue += client.contractPrice;
    } else {
      rows.set(client.propertyId, {
        propertyId: client.propertyId,
        title,
        salesCount: 1,
        salesValue: client.contractPrice,
      });
    }
  }

  return Array.from(rows.values())
    .sort((a, b) => b.salesValue - a.salesValue)
    .slice(0, limit);
}

/** Month-over-month sales value comparison, e.g. for the Broker dashboard's trend stat. */
export interface MonthOverMonth {
  thisMonthValue: number;
  lastMonthValue: number;
  deltaPercent: number | null;
}

export function getMonthOverMonthSales(clients: Client[], reference: Date = new Date()): MonthOverMonth {
  const year = reference.getFullYear();
  const month = reference.getMonth();

  const thisMonthClients = clients.filter((c) => {
    const d = new Date(c.reservationDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const lastMonthDate = new Date(year, month - 1, 1);
  const lastMonthClients = clients.filter((c) => {
    const d = new Date(c.reservationDate);
    return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth();
  });

  const thisMonthValue = sumContractPrice(thisMonthClients);
  const lastMonthValue = sumContractPrice(lastMonthClients);
  const deltaPercent = lastMonthValue > 0 ? ((thisMonthValue - lastMonthValue) / lastMonthValue) * 100 : null;

  return { thisMonthValue, lastMonthValue, deltaPercent };
}

export interface ReleasedVsPending {
  releasedValue: number;
  pendingValue: number;
}

/** "Pending" here means vouchers created but not yet Released — Signed or Check Ready. */
export function getReleasedVsPendingThisMonth(vouchers: Voucher[], reference: Date = new Date()): ReleasedVsPending {
  const year = reference.getFullYear();
  const month = reference.getMonth();

  const releasedThisMonth = vouchers.filter((v) => {
    if (v.status !== "Released" || !v.dateDisbursed) return false;
    const d = new Date(v.dateDisbursed);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const pending = vouchers.filter((v) => v.status === "Signed" || v.status === "Check Ready");

  return {
    releasedValue: releasedThisMonth.reduce((sum, v) => sum + v.netCommissionReceivable, 0),
    pendingValue: pending.reduce((sum, v) => sum + v.netCommissionReceivable, 0),
  };
}

export interface TeamPerformanceRow {
  consultantId: string;
  name: string;
  clientCount: number;
  salesValue: number;
  releasedValue: number;
  pendingValue: number;
}

/** Broker's per-Sales-Manager rollup — "their team" means the SM plus every SP
 * reporting to them, matching how clients actually attribute (Referred sales are
 * booked against the Sales Person, not the SM). */
export function getTeamPerformanceByManager(
  salesManagers: Consultant[],
  allConsultants: Consultant[],
  clients: Client[],
  vouchers: Voucher[],
): TeamPerformanceRow[] {
  return salesManagers.map((sm) => {
    const teamIds = [sm.id, ...allConsultants.filter((c) => c.reportsTo === sm.id).map((c) => c.id)];
    const teamClients = clients.filter((c) => teamIds.includes(c.consultantId));
    const teamVouchers = vouchers.filter((v) => teamIds.includes(v.consultantId));
    return {
      consultantId: sm.id,
      name: sm.name,
      clientCount: teamClients.length,
      salesValue: sumContractPrice(teamClients),
      releasedValue: teamVouchers
        .filter((v) => v.status === "Released")
        .reduce((sum, v) => sum + v.netCommissionReceivable, 0),
      pendingValue: teamVouchers
        .filter((v) => v.status === "Signed" || v.status === "Check Ready")
        .reduce((sum, v) => sum + v.netCommissionReceivable, 0),
    };
  });
}

export interface AgingBucket {
  tier: PayoutAgingTier;
  label: string;
  count: number;
  value: number;
}

export function getAgingDistribution(requests: EligibleCommissionRequest[]): AgingBucket[] {
  const buckets: Record<PayoutAgingTier, AgingBucket> = {
    fresh: { tier: "fresh", label: "Fresh (0–7 days)", count: 0, value: 0 },
    amber: { tier: "amber", label: "Aging (8–14 days)", count: 0, value: 0 },
    red: { tier: "red", label: "Overdue (14+ days)", count: 0, value: 0 },
  };
  for (const request of requests) {
    const tier = getPayoutAgingTier(request.detectedDate);
    buckets[tier].count += 1;
    buckets[tier].value += request.breakdown.netCommissionReceivable;
  }
  return [buckets.fresh, buckets.amber, buckets.red];
}

export interface MonthlyTrendRow {
  monthLabel: string;
  clientsAdded: number;
  salesClosed: number;
  commissionReleased: number;
}

/** Trailing N months (oldest first) — "sales closed" here means the same client-as-sale
 * basis as everywhere else, so this table reads consistently with the rest of the report. */
export function getMonthlyTrend(
  clients: Client[],
  vouchers: Voucher[],
  monthsBack = 6,
  reference: Date = new Date(),
): MonthlyTrendRow[] {
  const rows: MonthlyTrendRow[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const target = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const year = target.getFullYear();
    const month = target.getMonth();

    const monthClients = clients.filter((c) => {
      const d = new Date(c.reservationDate);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const monthReleasedVouchers = vouchers.filter((v) => {
      if (v.status !== "Released" || !v.dateDisbursed) return false;
      const d = new Date(v.dateDisbursed);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    rows.push({
      monthLabel: target.toLocaleDateString("en-PH", { year: "numeric", month: "short" }),
      clientsAdded: monthClients.length,
      salesClosed: monthClients.length,
      commissionReleased: monthReleasedVouchers.reduce((sum, v) => sum + v.netCommissionReceivable, 0),
    });
  }
  return rows;
}

export interface CommissionSummary {
  totalEarned: number;
  released: number;
  pending: number;
  eligible: number;
}

export function getCommissionSummary(vouchers: Voucher[], eligibleValue: number): CommissionSummary {
  const released = vouchers
    .filter((v) => v.status === "Released")
    .reduce((sum, v) => sum + v.netCommissionReceivable, 0);
  const pending = vouchers
    .filter((v) => v.status === "Signed" || v.status === "Check Ready" || v.status === "Pending Signature")
    .reduce((sum, v) => sum + v.netCommissionReceivable, 0);
  return { totalEarned: released + pending, released, pending, eligible: eligibleValue };
}
