import { developers } from "../mocks";
import type { Developer } from "../types";
import { withDelay } from "./delay";

export function getDevelopers(): Promise<Developer[]> {
  return withDelay(developers);
}

export function getDevelopersByFirm(companyId: string): Promise<Developer[]> {
  return withDelay(developers.filter((dev) => dev.companyId === companyId));
}

export function getDeveloperById(id: string): Promise<Developer | undefined> {
  return withDelay(developers.find((dev) => dev.id === id));
}
