import { clientStatusHistory as seedHistory } from "../mocks";
import type { ClientStatus, ClientStatusHistoryEntry } from "../types";
import { withDelay } from "./delay";
import { loadPersisted, savePersisted } from "./persist";

const STORAGE_KEY = "trustlist.clientStatusHistory";

const history: ClientStatusHistoryEntry[] = loadPersisted(STORAGE_KEY, seedHistory);

function persist(): void {
  savePersisted(STORAGE_KEY, history);
}

export function getStatusHistoryByClient(clientId: string): Promise<ClientStatusHistoryEntry[]> {
  return withDelay(
    history
      .filter((h) => h.clientId === clientId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  );
}

export function recordStatusHistory(
  clientId: string,
  fromStatus: ClientStatus | "New",
  toStatus: ClientStatus,
  remarks: string,
  updatedBy: string,
): Promise<ClientStatusHistoryEntry> {
  const entry: ClientStatusHistoryEntry = {
    id: `hist-${Date.now()}`,
    clientId,
    fromStatus,
    toStatus,
    remarks,
    updatedBy,
    date: new Date().toISOString().slice(0, 10),
  };
  history.push(entry);
  persist();
  return withDelay(entry);
}
