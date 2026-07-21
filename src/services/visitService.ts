import { visits as seedVisits } from "../mocks";
import type { VisitRequest, VisitRequestStatus } from "../types";
import { withDelay } from "./delay";
import { loadPersisted, savePersisted } from "./persist";
import { getPropertyById } from "./propertyService";

const STORAGE_KEY = "trustlist.visits";

const visits: VisitRequest[] = loadPersisted(STORAGE_KEY, seedVisits);

function persist(): void {
  savePersisted(STORAGE_KEY, visits);
}

export async function submitVisitRequest(
  input: Omit<VisitRequest, "id" | "submittedAt" | "status" | "companyId">,
): Promise<VisitRequest> {
  const property = await getPropertyById(input.propertyId);
  const visit: VisitRequest = {
    ...input,
    id: `visit-${Date.now()}`,
    companyId: property?.companyId ?? "",
    status: "Pending",
    submittedAt: new Date().toISOString(),
  };
  visits.push(visit);
  persist();
  return withDelay(visit);
}

export function getVisitRequestsByFirm(companyId: string): Promise<VisitRequest[]> {
  return withDelay(visits.filter((v) => v.companyId === companyId));
}

export function updateVisitRequestStatus(
  id: string,
  status: Extract<VisitRequestStatus, "Approved" | "Declined">,
): Promise<VisitRequest | undefined> {
  const visit = visits.find((v) => v.id === id);
  if (visit) {
    visit.status = status;
    persist();
  }
  return withDelay(visit);
}
