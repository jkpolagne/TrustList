import { clients as seedClients } from "../mocks";
import type { Client, EmploymentStatus, PaymentMethod, SaleType } from "../types";
import { buildRequirementsChecklist } from "../utils/requirementsTemplate";
import { withDelay } from "./delay";
import { loadPersisted, savePersisted } from "./persist";

const STORAGE_KEY = "trustlist.clients";

const clients: Client[] = loadPersisted(STORAGE_KEY, seedClients);

function persist(): void {
  savePersisted(STORAGE_KEY, clients);
}

export function getClients(): Promise<Client[]> {
  return withDelay(clients);
}

export function getClientsByFirm(companyId: string): Promise<Client[]> {
  return withDelay(clients.filter((c) => c.companyId === companyId));
}

export function getClientsByConsultant(consultantId: string): Promise<Client[]> {
  return withDelay(clients.filter((c) => c.consultantId === consultantId));
}

export function getClientsByConsultantIds(consultantIds: string[]): Promise<Client[]> {
  return withDelay(clients.filter((c) => consultantIds.includes(c.consultantId)));
}

export function getClientById(id: string): Promise<Client | undefined> {
  return withDelay(clients.find((c) => c.id === id));
}

export interface CreateClientInput {
  companyId: string;
  name: string;
  contactNumber: string;
  email: string;
  employmentStatus: EmploymentStatus;
  propertyId: string;
  consultantId: string;
  saleType: SaleType;
  paymentMethod: PaymentMethod;
  contractPrice: number;
  reservationDate: string;
}

/** Brings a new buyer onto the books — e.g. once a scheduled visit turns into
 * a committed sale. Tranches always start at 0/unpaid; the requirements
 * checklist is generated fresh (all unchecked) from the payment method and
 * employment status per CLAUDE.md's requirements-gate spec. */
export function createClient(input: CreateClientInput): Promise<Client> {
  const id = `cli-${Date.now()}`;
  const client: Client = {
    id,
    companyId: input.companyId,
    name: input.name,
    contactNumber: input.contactNumber,
    email: input.email,
    employmentStatus: input.employmentStatus,
    propertyId: input.propertyId,
    consultantId: input.consultantId,
    saleType: input.saleType,
    paymentMethod: input.paymentMethod,
    contractPrice: input.contractPrice,
    totalTranches: input.paymentMethod === "Cash" ? 1 : 4,
    currentTranche: 0,
    amountPaid: 0,
    status: "Active",
    requirementsChecklist: buildRequirementsChecklist(input.paymentMethod, input.employmentStatus, id),
    reservationDate: input.reservationDate,
  };
  clients.push(client);
  persist();
  return withDelay(client);
}

export function logClientContact(id: string, notes: string): Promise<Client | undefined> {
  const client = clients.find((c) => c.id === id);
  if (client) {
    client.lastContactedDate = new Date().toISOString().slice(0, 10);
    client.notes = notes;
    persist();
  }
  return withDelay(client);
}

/** Internal — mutates the shared store; used by paymentProofService after a payment is recorded. */
export function _applyClientPayment(
  id: string,
  newAmountPaid: number,
  newTranche: number,
): Client | undefined {
  const client = clients.find((c) => c.id === id);
  if (!client) return undefined;
  client.amountPaid = newAmountPaid;
  client.currentTranche = newTranche;
  if (newTranche >= client.totalTranches) {
    client.status = "Fully Released";
  }
  persist();
  return client;
}
