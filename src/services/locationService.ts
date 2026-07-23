import { locations } from "../mocks";
import type { LocationZonalValue } from "../types";
import { withDelay } from "./delay";

/** Static reference data — no admin editing surface for this yet, so no persistence layer. */
export function getLocations(): Promise<LocationZonalValue[]> {
  return withDelay(locations);
}

export function getZonalValuePerSqm(city: string, barangay: string): Promise<number | undefined> {
  const match = locations.find(
    (l) => l.city === city && l.barangay.trim().toLowerCase() === barangay.trim().toLowerCase(),
  );
  return withDelay(match?.zonalValuePerSqm);
}
