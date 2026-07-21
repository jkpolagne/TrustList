import { developers as seedDevelopers } from "../mocks";
import type { Developer } from "../types";
import { withDelay } from "./delay";
import { loadPersisted, savePersisted } from "./persist";

const STORAGE_KEY = "trustlist.developers";

const developers: Developer[] = loadPersisted(STORAGE_KEY, seedDevelopers);

function persist(): void {
  savePersisted(STORAGE_KEY, developers);
}

export function getDevelopers(): Promise<Developer[]> {
  return withDelay(developers);
}

export function getDevelopersByFirm(companyId: string): Promise<Developer[]> {
  return withDelay(developers.filter((dev) => dev.companyId === companyId));
}

export function getDeveloperById(id: string): Promise<Developer | undefined> {
  return withDelay(developers.find((dev) => dev.id === id));
}

export function createDeveloper(input: Omit<Developer, "id">): Promise<Developer> {
  const developer: Developer = { ...input, id: `dev-${Date.now()}` };
  developers.push(developer);
  persist();
  return withDelay(developer);
}

export function updateDeveloper(
  id: string,
  input: Omit<Developer, "id" | "companyId">,
): Promise<Developer | undefined> {
  const developer = developers.find((d) => d.id === id);
  if (developer) {
    Object.assign(developer, input);
    persist();
  }
  return withDelay(developer);
}
