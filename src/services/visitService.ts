import { visits as seedVisits } from "../mocks";
import type {
  EmploymentStatus,
  PaymentMethod,
  SaleType,
  VisitRequest,
  VisitRequestStatus,
} from "../types";
import { createClient } from "./clientService";
import { recordStatusHistory } from "./clientStatusHistoryService";
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

export interface ConvertVisitToClientInput {
  consultantId: string;
  saleType: SaleType;
  paymentMethod: PaymentMethod;
  employmentStatus: EmploymentStatus;
  contractPrice: number;
  reservationDate: string;
}

/** Turns an approved visit request into a monitored Client record in one step —
 * without this, a buyer who scheduled a visit (even through a consultant's
 * referral link) never shows up in Monitor Clients, since the two records
 * were otherwise completely disconnected. */
export async function convertVisitToClient(
  id: string,
  input: ConvertVisitToClientInput,
  convertedBy: string,
): Promise<VisitRequest | undefined> {
  const visit = visits.find((v) => v.id === id);
  if (!visit) return undefined;

  const client = await createClient({
    companyId: visit.companyId,
    name: visit.name,
    contactNumber: visit.phone,
    email: visit.email,
    employmentStatus: input.employmentStatus,
    propertyId: visit.propertyId,
    consultantId: input.consultantId,
    saleType: input.saleType,
    paymentMethod: input.paymentMethod,
    contractPrice: input.contractPrice,
    reservationDate: input.reservationDate,
  });

  await recordStatusHistory(
    client.id,
    "New",
    "Active",
    "Client record created after an approved property visit.",
    convertedBy,
  );

  visit.clientId = client.id;
  persist();
  return withDelay(visit);
}
