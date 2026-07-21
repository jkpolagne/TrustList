import { companyAdmins as seedAdmins } from "../mocks";
import type { CompanyAdminAccount } from "../types";
import { withDelay } from "./delay";
import { loadPersisted, savePersisted } from "./persist";
import { recordLogEntry } from "./platformLogService";

const STORAGE_KEY = "trustlist.companyAdmins";

const admins: CompanyAdminAccount[] = loadPersisted(STORAGE_KEY, seedAdmins);

function persist(): void {
  savePersisted(STORAGE_KEY, admins);
}

export function getCompanyAdmins(): Promise<CompanyAdminAccount[]> {
  return withDelay(admins);
}

export function getCompanyAdminsByFirm(firmId: string): Promise<CompanyAdminAccount[]> {
  return withDelay(admins.filter((a) => a.firmId === firmId));
}

/** Firm id -> number of Company Admin accounts, for the Super Admin portfolio view. */
export function getCompanyAdminCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const admin of admins) {
    counts[admin.firmId] = (counts[admin.firmId] ?? 0) + 1;
  }
  return withDelay(counts);
}

export function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return `${result}!`;
}

export function createCompanyAdmin(
  input: Omit<CompanyAdminAccount, "id" | "createdAt">,
): Promise<CompanyAdminAccount> {
  const admin: CompanyAdminAccount = {
    ...input,
    id: `admin-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  admins.push(admin);
  persist();
  recordLogEntry(
    "Company Admin Created",
    `Company Admin account created for ${admin.name}.`,
    admin.firmId,
  );
  return withDelay(admin);
}
