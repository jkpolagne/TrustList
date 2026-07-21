import { platformLogs as seedLogs } from "../mocks";
import type { PlatformLogEntry, PlatformLogEventType } from "../types";
import { withDelay } from "./delay";
import { loadPersisted, savePersisted } from "./persist";

const STORAGE_KEY = "trustlist.platformLogs";

const logs: PlatformLogEntry[] = loadPersisted(STORAGE_KEY, seedLogs);

function persist(): void {
  savePersisted(STORAGE_KEY, logs);
}

/** Used internally by firmService / companyAdminService — not exported to components. */
export function recordLogEntry(eventType: PlatformLogEventType, message: string, firmId?: string): void {
  logs.push({
    id: `log-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    eventType,
    firmId,
    message,
  });
  persist();
}

export function getPlatformLogs(): Promise<PlatformLogEntry[]> {
  return withDelay(
    [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  );
}
