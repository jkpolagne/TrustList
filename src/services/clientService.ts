import { clients as seedClients } from "../mocks";
import type { Client } from "../types";
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
