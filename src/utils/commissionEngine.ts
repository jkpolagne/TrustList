import type { Client, ConsultantRole, Consultant, Developer } from "../types";
import { getRequirementsState } from "./requirements";

export function round2(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export interface RoleEntitlement {
  role: ConsultantRole;
  consultantId: string;
  ratePercent: number;
}

export interface TrancheBreakdown extends RoleEntitlement {
  trancheNumber: number;
  totalTranches: number;
  totalCommissionForRole: number;
  grossCommission: number;
  lessEwt: number;
  totalCommissionDue: number;
  netCommissionReceivable: number;
}

/** Who is entitled to a cut of this sale, and at what per-developer negotiated rate.
 * Direct sale (consultantId is a Sales Manager): Broker + that Sales Manager only.
 * Referred sale (consultantId is a Sales Person): Broker + their Sales Manager + the Sales Person. */
export function getEntitledRoles(
  client: Client,
  developer: Developer,
  allConsultants: Consultant[],
): RoleEntitlement[] {
  const broker = allConsultants.find((c) => c.companyId === client.companyId && c.role === "Broker");
  const consultant = allConsultants.find((c) => c.id === client.consultantId);
  const rates = client.saleType === "Direct" ? developer.commissionRates.direct : developer.commissionRates.referred;

  const roles: RoleEntitlement[] = [];
  if (broker) roles.push({ role: "Broker", consultantId: broker.id, ratePercent: rates.broker });

  if (client.saleType === "Direct") {
    if (consultant) {
      roles.push({ role: "Sales Manager", consultantId: consultant.id, ratePercent: rates.salesManager });
    }
  } else {
    const salesManager = allConsultants.find((c) => c.id === consultant?.reportsTo);
    if (salesManager) {
      roles.push({ role: "Sales Manager", consultantId: salesManager.id, ratePercent: rates.salesManager });
    }
    if (consultant) {
      roles.push({ role: "Sales Person", consultantId: consultant.id, ratePercent: rates.salesPerson });
    }
  }
  return roles;
}

/** Per-role commission math for one reached tranche. Each tranche = an even share
 * (1/totalTranches) of that role's total commission over the full contract. */
export function computeTrancheBreakdown(
  client: Client,
  developer: Developer,
  allConsultants: Consultant[],
  trancheNumber: number,
): TrancheBreakdown[] {
  return getEntitledRoles(client, developer, allConsultants).map((entitlement) => {
    const totalCommissionForRole = round2(client.contractPrice * (entitlement.ratePercent / 100));
    const grossCommission = round2(totalCommissionForRole / client.totalTranches);
    const lessEwt = round2(grossCommission * 0.1);
    const totalCommissionDue = round2(grossCommission - lessEwt);
    return {
      ...entitlement,
      trancheNumber,
      totalTranches: client.totalTranches,
      totalCommissionForRole,
      grossCommission,
      lessEwt,
      totalCommissionDue,
      netCommissionReceivable: totalCommissionDue,
    };
  });
}

export function formatReleaseNumber(trancheNumber: number, totalTranches: number): string {
  return `${trancheNumber} of ${totalTranches}`;
}

/** Bank Financing gates the final RELEASE step only — tranche 1 needs the Basic phase
 * complete, later tranches need the full Complete phase. Cash and In-House are never gated.
 * Vouchers can still be created/signed while blocked; only the check-release action is held. */
export function isTrancheReleaseBlocked(client: Client, trancheNumber: number): boolean {
  if (client.paymentMethod !== "Bank Financing") return false;
  const state = getRequirementsState(client);
  if (trancheNumber <= 1) return state === "Incomplete";
  return state !== "Complete";
}
