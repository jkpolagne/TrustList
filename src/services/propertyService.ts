import { properties } from "../mocks";
import type { Property } from "../types";
import { withDelay } from "./delay";

function isPublicListing(property: Property): boolean {
  if (property.listingSource === "Developer") return true;
  return property.verificationStatus === "Verified";
}

export function getProperties(): Promise<Property[]> {
  return withDelay(properties);
}

/** Multi-firm aggregated view for the public buyer-facing hub. */
export function getPublicProperties(): Promise<Property[]> {
  return withDelay(properties.filter(isPublicListing));
}

export function getPropertiesByFirm(companyId: string): Promise<Property[]> {
  return withDelay(properties.filter((p) => p.companyId === companyId));
}

export function getPropertyById(id: string): Promise<Property | undefined> {
  return withDelay(properties.find((p) => p.id === id));
}
