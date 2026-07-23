import { vouchers as seedVouchers } from "../mocks";
import type { Client, ConsultantRole, Developer, Property, SaleType, Voucher, VoucherStatus } from "../types";
import {
  computeTrancheBreakdown,
  formatReleaseNumber,
  isTrancheReleaseBlocked,
  round2,
  type TrancheBreakdown,
} from "../utils/commissionEngine";
import { getClientsByFirm } from "./clientService";
import { getConsultantsByFirm } from "./consultantService";
import { withDelay } from "./delay";
import { getDevelopers } from "./developerService";
import { markMilestoneVoucherCreated, getMilestoneEventsByFirm } from "./milestoneService";
import { loadPersisted, savePersisted } from "./persist";
import { getPropertiesByFirm } from "./propertyService";

const STORAGE_KEY = "trustlist.vouchers";

const vouchers: Voucher[] = loadPersisted(STORAGE_KEY, seedVouchers);

function persist(): void {
  savePersisted(STORAGE_KEY, vouchers);
}

export function getVouchersByFirm(companyId: string): Promise<Voucher[]> {
  return withDelay(vouchers.filter((v) => v.companyId === companyId));
}

export function getVouchersByConsultantIds(consultantIds: string[]): Promise<Voucher[]> {
  return withDelay(vouchers.filter((v) => consultantIds.includes(v.consultantId)));
}

export function getVoucherById(id: string): Promise<Voucher | undefined> {
  return withDelay(vouchers.find((v) => v.id === id));
}

export interface EligibleCommissionRequest {
  milestoneEventId: string;
  client: Client;
  developer: Developer;
  property: Property;
  trancheNumber: number;
  totalTranches: number;
  detectedDate: string;
  breakdown: TrancheBreakdown;
  consultantName: string;
}

/** The single source of truth for "money owed but not yet paperworked": every entitled
 * role/tranche combo with a milestone reached and no voucher record yet. Feeds the broker's
 * eligible-requests count, the Create Voucher picker, and the Expected Developer Payout view. */
export async function getEligibleCommissionRequests(companyId: string): Promise<EligibleCommissionRequest[]> {
  const [milestones, clients, consultants, developers, properties, firmVouchers] = await Promise.all([
    getMilestoneEventsByFirm(companyId),
    getClientsByFirm(companyId),
    getConsultantsByFirm(companyId),
    getDevelopers(),
    getPropertiesByFirm(companyId),
    getVouchersByFirm(companyId),
  ]);

  const clientsById = new Map(clients.map((c) => [c.id, c]));
  const propertiesById = new Map(properties.map((p) => [p.id, p]));
  const developersById = new Map(developers.map((d) => [d.id, d]));
  const consultantsById = new Map(consultants.map((c) => [c.id, c]));

  const results: EligibleCommissionRequest[] = [];

  for (const milestone of milestones) {
    const client = clientsById.get(milestone.clientId);
    if (!client) continue;
    const property = propertiesById.get(client.propertyId);
    const developer = property?.developerId ? developersById.get(property.developerId) : undefined;
    if (!property || !developer) continue;

    // A tranche whose requirements checklist isn't where it needs to be yet is not
    // "eligible" at all — the broker shouldn't even see it as owed, let alone action it.
    if (isTrancheReleaseBlocked(client, milestone.trancheNumber)) continue;

    const breakdowns = computeTrancheBreakdown(client, developer, consultants, milestone.trancheNumber);
    for (const breakdown of breakdowns) {
      const alreadyVouchered = firmVouchers.some(
        (v) =>
          v.clientId === client.id &&
          v.trancheNumber === milestone.trancheNumber &&
          v.role === breakdown.role,
      );
      if (alreadyVouchered) continue;

      results.push({
        milestoneEventId: milestone.id,
        client,
        developer,
        property,
        trancheNumber: milestone.trancheNumber,
        totalTranches: milestone.totalTranches,
        detectedDate: milestone.detectedDate,
        breakdown,
        consultantName: consultantsById.get(breakdown.consultantId)?.name ?? "—",
      });
    }
  }

  return results.sort((a, b) => new Date(a.detectedDate).getTime() - new Date(b.detectedDate).getTime());
}

export interface CreateVoucherInput {
  companyId: string;
  clientId: string;
  developerId: string;
  role: ConsultantRole;
  consultantId: string;
  saleType: SaleType;
  trancheNumber: number;
  totalTranches: number;
  paidTo: string;
  buyer: string;
  rsDate: string;
  ntcp: number;
  ratePercent: number;
  blockLot: string;
  grossCommission: number;
  lessEwt: number;
  lessAdcom: number;
  lessMiscTax: number;
  otherDeductions: number;
  approvedBy: string;
}

/** Persists a voucher for one entitled role's share of one reached tranche. The gross
 * commission and EWT come straight from the tranche engine (never hardcoded by the
 * component); only the final subtraction into totals happens here, once, authoritatively. */
export async function createVoucher(input: CreateVoucherInput): Promise<Voucher> {
  const totalCommissionDue = round2(input.grossCommission - input.lessEwt - input.lessAdcom);
  const netCommissionReceivable = round2(totalCommissionDue - input.lessMiscTax - input.otherDeductions);

  const voucher: Voucher = {
    id: `vou-${Date.now()}`,
    companyId: input.companyId,
    clientId: input.clientId,
    developerId: input.developerId,
    role: input.role,
    consultantId: input.consultantId,
    saleType: input.saleType,
    trancheNumber: input.trancheNumber,
    totalTranches: input.totalTranches,
    paidTo: input.paidTo,
    buyer: input.buyer,
    rsDate: input.rsDate,
    ntcp: input.ntcp,
    releaseNumber: formatReleaseNumber(input.trancheNumber, input.totalTranches),
    ratePercent: input.ratePercent,
    blockLot: input.blockLot,
    grossCommission: input.grossCommission,
    lessEwt: input.lessEwt,
    lessAdcom: input.lessAdcom,
    totalCommissionDue,
    lessMiscTax: input.lessMiscTax,
    otherDeductions: input.otherDeductions,
    netCommissionReceivable,
    approvedBy: input.approvedBy,
    approvedSignedAt: new Date().toISOString(),
    status: "Pending Signature",
    createdAt: new Date().toISOString(),
  };

  vouchers.push(voucher);
  persist();
  await markMilestoneVoucherCreated(input.clientId, input.trancheNumber);
  return voucher;
}

export async function signVoucher(id: string, receivedBy: string): Promise<Voucher | undefined> {
  const voucher = vouchers.find((v) => v.id === id);
  if (voucher && voucher.status === "Pending Signature") {
    voucher.status = "Signed";
    voucher.receivedBy = receivedBy;
    voucher.receivedSignedAt = new Date().toISOString();
    persist();
  }
  return withDelay(voucher);
}

export async function disputeVoucher(id: string, reason: string): Promise<Voucher | undefined> {
  const voucher = vouchers.find((v) => v.id === id);
  if (voucher && voucher.status === "Pending Signature") {
    voucher.status = "Disputed";
    voucher.disputeReason = reason;
    voucher.disputedAt = new Date().toISOString();
    persist();
  }
  return withDelay(voucher);
}

/** Lets the broker put a disputed voucher back in front of the consultant after
 * revising it — otherwise "Disputed" would be a workflow dead end. */
export async function resubmitVoucher(id: string): Promise<Voucher | undefined> {
  const voucher = vouchers.find((v) => v.id === id);
  if (voucher && voucher.status === "Disputed") {
    voucher.status = "Pending Signature";
    voucher.disputeReason = undefined;
    voucher.disputedAt = undefined;
    voucher.approvedSignedAt = new Date().toISOString();
    persist();
  }
  return withDelay(voucher);
}

export async function prepareCheck(
  id: string,
  checkNumber: string,
  bank: string,
  checkDate: string,
): Promise<Voucher | undefined> {
  const voucher = vouchers.find((v) => v.id === id);
  if (voucher && voucher.status === "Signed") {
    voucher.status = "Check Ready";
    voucher.checkNumber = checkNumber;
    voucher.bank = bank;
    voucher.checkDate = checkDate;
    persist();
  }
  return withDelay(voucher);
}

export async function releaseVoucher(id: string): Promise<Voucher | undefined> {
  const voucher = vouchers.find((v) => v.id === id);
  if (voucher && voucher.status === "Check Ready") {
    voucher.status = "Released";
    voucher.dateDisbursed = new Date().toISOString().slice(0, 10);
    persist();
  }
  return withDelay(voucher);
}

export const VOUCHER_STATUSES: VoucherStatus[] = [
  "Pending Signature",
  "Signed",
  "Disputed",
  "Check Ready",
  "Released",
];
