import { clients } from "../mocks";
import type { Client } from "../types";
import { withDelay } from "./delay";

export function getClients(): Promise<Client[]> {
  return withDelay(clients);
}

export function getClientsByFirm(companyId: string): Promise<Client[]> {
  return withDelay(clients.filter((c) => c.companyId === companyId));
}

export function getClientsByConsultant(consultantId: string): Promise<Client[]> {
  return withDelay(clients.filter((c) => c.consultantId === consultantId));
}

export function getClientById(id: string): Promise<Client | undefined> {
  return withDelay(clients.find((c) => c.id === id));
}
