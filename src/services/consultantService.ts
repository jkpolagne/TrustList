import { consultants } from "../mocks";
import type { Consultant } from "../types";
import { withDelay } from "./delay";

export function getConsultants(): Promise<Consultant[]> {
  return withDelay(consultants);
}

export function getConsultantsByFirm(companyId: string): Promise<Consultant[]> {
  return withDelay(consultants.filter((c) => c.companyId === companyId));
}

export function getConsultantById(id: string): Promise<Consultant | undefined> {
  return withDelay(consultants.find((c) => c.id === id));
}

export function getConsultantByLinkCode(linkCode: string): Promise<Consultant | undefined> {
  return withDelay(consultants.find((c) => c.linkCode === linkCode));
}
