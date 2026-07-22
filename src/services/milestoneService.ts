import { milestoneEvents as seedMilestones } from "../mocks";
import type { MilestoneEvent } from "../types";
import { withDelay } from "./delay";
import { loadPersisted, savePersisted } from "./persist";

const STORAGE_KEY = "trustlist.milestoneEvents";

const milestoneEvents: MilestoneEvent[] = loadPersisted(STORAGE_KEY, seedMilestones);

function persist(): void {
  savePersisted(STORAGE_KEY, milestoneEvents);
}

export function getMilestoneEventsByFirm(companyId: string): Promise<MilestoneEvent[]> {
  return withDelay(milestoneEvents.filter((m) => m.companyId === companyId));
}

export function getMilestoneEventsByClientIds(clientIds: string[]): Promise<MilestoneEvent[]> {
  return withDelay(milestoneEvents.filter((m) => clientIds.includes(m.clientId)));
}

export function getLatestMilestoneForClient(clientId: string): Promise<MilestoneEvent | undefined> {
  const forClient = milestoneEvents
    .filter((m) => m.clientId === clientId)
    .sort((a, b) => new Date(b.detectedDate).getTime() - new Date(a.detectedDate).getTime());
  return withDelay(forClient[0]);
}

/** Records a freshly-crossed tranche threshold — this is what Stage 7's broker
 * dashboard will read via voucherStatus "Pending" to know a voucher is owed. */
export function recordMilestoneEvent(
  companyId: string,
  clientId: string,
  trancheNumber: number,
  totalTranches: number,
): Promise<MilestoneEvent> {
  const event: MilestoneEvent = {
    id: `mile-${Date.now()}`,
    companyId,
    clientId,
    trancheNumber,
    totalTranches,
    detectedDate: new Date().toISOString().slice(0, 10),
    voucherStatus: "Pending",
  };
  milestoneEvents.push(event);
  persist();
  return withDelay(event);
}

/** Flips the milestone's flag once the broker has started acting on it — first voucher
 * created for that tranche is enough to clear it from the simple Stage-6 milestone list;
 * the richer per-role remaining balance still shows up in Stage 7's Awaiting Payout view. */
export function markMilestoneVoucherCreated(clientId: string, trancheNumber: number): Promise<void> {
  const event = milestoneEvents.find(
    (m) => m.clientId === clientId && m.trancheNumber === trancheNumber,
  );
  if (event) {
    event.voucherStatus = "Voucher Created";
    persist();
  }
  return withDelay(undefined);
}
