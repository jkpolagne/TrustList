import { consultants as seedConsultants } from "../mocks";
import type { Consultant, ConsultantRole } from "../types";
import { buildFullName } from "../utils/names";
import { withDelay } from "./delay";
import { loadPersisted, savePersisted } from "./persist";

const STORAGE_KEY = "trustlist.consultants";

const consultants: Consultant[] = loadPersisted(STORAGE_KEY, seedConsultants);

function persist(): void {
  savePersisted(STORAGE_KEY, consultants);
}

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

/** Firm-scoped, read-only view of every consultant with a generated link. */
export function getConsultantLinksByFirm(companyId: string): Promise<Consultant[]> {
  return withDelay(consultants.filter((c) => c.companyId === companyId && c.linkCode));
}

function roleCode(role: ConsultantRole): string {
  if (role === "Sales Manager") return "SM";
  if (role === "Sales Person") return "SP";
  return "BR";
}

function generateUniqueLinkCode(role: ConsultantRole, firmCode: string, lastName: string): string {
  const cleanLastName = lastName.replace(/[^a-zA-Z]/g, "").toUpperCase() || "AGENT";
  const base = `${roleCode(role)}-${firmCode}-${cleanLastName}`;
  let candidate = base;
  let suffix = 2;
  while (consultants.some((c) => c.linkCode === candidate)) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export type ConsultantInput = Omit<Consultant, "id" | "name" | "linkCode" | "linkStatus">;

/** Returns the new/updated consultant plus whether a link was freshly generated this call. */
export interface ConsultantSaveResult {
  consultant: Consultant;
  linkGenerated: boolean;
}

export function createConsultant(
  input: ConsultantInput,
  firmCode: string,
): Promise<ConsultantSaveResult> {
  const shouldHaveLink = input.role !== "Broker";
  const linkCode = shouldHaveLink
    ? generateUniqueLinkCode(input.role, firmCode, input.lastName)
    : undefined;

  const consultant: Consultant = {
    ...input,
    id: `cons-${Date.now()}`,
    name: buildFullName(input.firstName, input.middleName, input.lastName),
    linkCode,
    linkStatus: shouldHaveLink ? "Active" : undefined,
  };

  consultants.push(consultant);
  persist();
  return withDelay({ consultant, linkGenerated: shouldHaveLink });
}

export function updateConsultant(
  id: string,
  input: ConsultantInput,
  firmCode: string,
): Promise<ConsultantSaveResult | undefined> {
  const consultant = consultants.find((c) => c.id === id);
  if (!consultant) return withDelay(undefined);

  let linkGenerated = false;

  Object.assign(consultant, input, {
    name: buildFullName(input.firstName, input.middleName, input.lastName),
  });

  if (input.role === "Broker") {
    consultant.linkCode = undefined;
    consultant.linkStatus = undefined;
  } else if (!consultant.linkCode) {
    consultant.linkCode = generateUniqueLinkCode(input.role, firmCode, input.lastName);
    consultant.linkStatus = "Active";
    linkGenerated = true;
  }

  persist();
  return withDelay({ consultant, linkGenerated });
}
