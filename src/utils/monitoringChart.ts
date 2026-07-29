import type { Client, Consultant, Developer, Property } from "../types";

/** Bucket key for sales on Individual Seller listings — no developer commission
 * structure applies, but the sale is still real revenue and must appear in Total. */
export const INDIVIDUAL_SELLER_KEY = "__individual-seller__";

export interface MonitoringColumn {
  key: string;
  label: string;
}

export interface MonitoringBuyerRow {
  clientId: string;
  buyerName: string;
  tcp: number;
  amountsByColumn: Record<string, number>;
}

/** One row-group under a Sales Manager — either a real Sales Person's team, or the
 * synthetic group (named after the SM) holding deals the SM closed personally. */
export interface MonitoringPersonGroup {
  key: string;
  name: string;
  isDirect: boolean;
  buyers: MonitoringBuyerRow[];
  subtotal: number;
  subtotalByColumn: Record<string, number>;
}

export interface MonitoringManagerGroup {
  consultantId: string;
  name: string;
  personGroups: MonitoringPersonGroup[];
  total: number;
  totalByColumn: Record<string, number>;
}

export interface MonitoringChartResult {
  columns: MonitoringColumn[];
  managerGroups: MonitoringManagerGroup[];
  grandTotal: number;
  grandTotalByColumn: Record<string, number>;
}

/** Builds the Sales Manager → Salesperson → Buyer hierarchy for one calendar month,
 * matching the firm's real monitoring-chart format. `month` is "YYYY-MM". Only
 * groups with at least one buyer that month are included — this mirrors an actual
 * monthly transaction sheet, not a full roster. */
export function buildMonitoringChart(
  clients: Client[],
  properties: Property[],
  consultants: Consultant[],
  developers: Developer[],
  month: string,
  developerFilter: string,
): MonitoringChartResult {
  const propertiesById = new Map(properties.map((p) => [p.id, p]));

  function columnKeyFor(client: Client): string {
    return propertiesById.get(client.propertyId)?.developerId ?? INDIVIDUAL_SELLER_KEY;
  }

  const monthClients = clients
    .filter((c) => c.reservationDate.slice(0, 7) === month)
    .filter((c) => developerFilter === "All" || columnKeyFor(c) === developerFilter)
    .sort((a, b) => a.reservationDate.localeCompare(b.reservationDate));

  const hasIndividualSeller = monthClients.some((c) => columnKeyFor(c) === INDIVIDUAL_SELLER_KEY);

  const columns: MonitoringColumn[] = [
    ...developers.map((d) => ({ key: d.id, label: d.name })),
    ...(hasIndividualSeller ? [{ key: INDIVIDUAL_SELLER_KEY, label: "Individual Seller" }] : []),
  ];

  function emptyColumnMap(): Record<string, number> {
    const map: Record<string, number> = {};
    for (const col of columns) map[col.key] = 0;
    return map;
  }

  function sumColumns(rows: MonitoringBuyerRow[]): Record<string, number> {
    const totals = emptyColumnMap();
    for (const row of rows) {
      for (const col of columns) totals[col.key] += row.amountsByColumn[col.key];
    }
    return totals;
  }

  function buildBuyerRow(client: Client): MonitoringBuyerRow {
    const amounts = emptyColumnMap();
    amounts[columnKeyFor(client)] = client.contractPrice;
    return { clientId: client.id, buyerName: client.name, tcp: client.contractPrice, amountsByColumn: amounts };
  }

  const managerGroups: MonitoringManagerGroup[] = [];

  for (const sm of consultants.filter((c) => c.role === "Sales Manager")) {
    const personGroups: MonitoringPersonGroup[] = [];

    for (const sp of consultants.filter((c) => c.role === "Sales Person" && c.reportsTo === sm.id)) {
      const buyers = monthClients.filter((c) => c.consultantId === sp.id).map(buildBuyerRow);
      if (buyers.length === 0) continue;
      personGroups.push({
        key: sp.id,
        name: sp.name,
        isDirect: false,
        buyers,
        subtotal: buyers.reduce((sum, b) => sum + b.tcp, 0),
        subtotalByColumn: sumColumns(buyers),
      });
    }

    const directBuyers = monthClients.filter((c) => c.consultantId === sm.id).map(buildBuyerRow);
    if (directBuyers.length > 0) {
      personGroups.push({
        key: `${sm.id}-direct`,
        name: sm.name,
        isDirect: true,
        buyers: directBuyers,
        subtotal: directBuyers.reduce((sum, b) => sum + b.tcp, 0),
        subtotalByColumn: sumColumns(directBuyers),
      });
    }

    if (personGroups.length === 0) continue;

    const allBuyers = personGroups.flatMap((g) => g.buyers);
    managerGroups.push({
      consultantId: sm.id,
      name: sm.name,
      personGroups,
      total: allBuyers.reduce((sum, b) => sum + b.tcp, 0),
      totalByColumn: sumColumns(allBuyers),
    });
  }

  const allBuyers = managerGroups.flatMap((g) => g.personGroups.flatMap((p) => p.buyers));

  return {
    columns,
    managerGroups,
    grandTotal: allBuyers.reduce((sum, b) => sum + b.tcp, 0),
    grandTotalByColumn: sumColumns(allBuyers),
  };
}
