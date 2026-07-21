import { firms as seedFirms } from "../mocks";
import type { Firm, FirmStatus } from "../types";
import { withDelay } from "./delay";
import { loadPersisted, savePersisted } from "./persist";
import { recordLogEntry } from "./platformLogService";

const STORAGE_KEY = "trustlist.firms";

const firms: Firm[] = loadPersisted(STORAGE_KEY, seedFirms);

function persist(): void {
  savePersisted(STORAGE_KEY, firms);
}

export function getFirms(): Promise<Firm[]> {
  return withDelay(firms);
}

export function getFirmById(id: string): Promise<Firm | undefined> {
  return withDelay(firms.find((firm) => firm.id === id));
}

export function onboardFirm(
  input: Omit<Firm, "id" | "code" | "isPrimary">,
): Promise<Firm> {
  const code = input.name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);

  const firm: Firm = { ...input, id: `firm-${Date.now()}`, code };
  firms.push(firm);
  persist();
  recordLogEntry("Firm Onboarded", `${firm.name} onboarded onto the platform.`, firm.id);
  return withDelay(firm);
}

export function updateFirmStatus(id: string, status: FirmStatus): Promise<Firm | undefined> {
  const firm = firms.find((f) => f.id === id);
  if (firm) {
    firm.status = status;
    persist();
    recordLogEntry(
      "Firm Status Changed",
      `${firm.name} ${status === "Active" ? "reactivated" : "suspended"}.`,
      firm.id,
    );
  }
  return withDelay(firm);
}
