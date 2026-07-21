import { firms } from "../mocks";
import type { Firm } from "../types";
import { withDelay } from "./delay";

export function getFirms(): Promise<Firm[]> {
  return withDelay(firms);
}

export function getFirmById(id: string): Promise<Firm | undefined> {
  return withDelay(firms.find((firm) => firm.id === id));
}
