import { properties as seedProperties } from "../mocks";
import type { ListingDraft, Property } from "../types";
import { withDelay } from "./delay";
import { loadPersisted, savePersisted } from "./persist";

const STORAGE_KEY = "trustlist.properties";

/** Mutable store, backed by localStorage, so admin actions (approve/reject/convert) persist. */
const properties: Property[] = loadPersisted(STORAGE_KEY, seedProperties);

function persist(): void {
  savePersisted(STORAGE_KEY, properties);
}

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

/** Same as getPropertyById, but returns undefined for listings not eligible for the public hub. */
export function getPublicPropertyById(id: string): Promise<Property | undefined> {
  const property = properties.find((p) => p.id === id);
  return withDelay(property && isPublicListing(property) ? property : undefined);
}

export function getPropertiesByIds(ids: string[]): Promise<Property[]> {
  return withDelay(properties.filter((p) => ids.includes(p.id)));
}

/** Individual Seller listings awaiting review, scoped to one firm. */
export function getPendingVerificationByFirm(companyId: string): Promise<Property[]> {
  return withDelay(
    properties.filter(
      (p) =>
        p.companyId === companyId &&
        p.listingSource === "Individual Seller" &&
        p.verificationStatus === "Pending Review",
    ),
  );
}

/** Individual Seller listings already decided (Verified or Rejected), scoped to one firm. */
export function getReviewedListingsByFirm(companyId: string): Promise<Property[]> {
  return withDelay(
    properties.filter(
      (p) =>
        p.companyId === companyId &&
        p.listingSource === "Individual Seller" &&
        (p.verificationStatus === "Verified" || p.verificationStatus === "Rejected"),
    ),
  );
}

/** Mock filenames standing in for the title copy + owner ID a seller would upload. */
export function mockVerificationDocuments(sellerName: string): string[] {
  return ["Transfer Certificate of Title - Copy.pdf", `Owner Valid ID - ${sellerName}.jpg`];
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Naga City": { lat: 13.6218, lng: 123.1948 },
  Pili: { lat: 13.5661, lng: 123.2767 },
  "Legazpi City": { lat: 13.1391, lng: 123.7438 },
};

/** Creates a Pending Review Individual Seller listing from a converted seller inquiry. */
export function createListingFromInquiry(
  companyId: string,
  sellerName: string,
  draft: ListingDraft,
): Promise<Property> {
  const property: Property = {
    id: `prop-${Date.now()}`,
    companyId,
    title: draft.title,
    propertyType: draft.propertyType,
    city: draft.city,
    address: draft.address,
    price: draft.price,
    bedrooms: draft.bedrooms,
    bathrooms: draft.bathrooms,
    lotAreaSqm: draft.lotAreaSqm,
    floorAreaSqm: draft.floorAreaSqm,
    isLotOnly: draft.propertyType === "Lot Only",
    status: "Available",
    listingSource: "Individual Seller",
    verificationStatus: "Pending Review",
    verificationDocuments: mockVerificationDocuments(sellerName),
    description: draft.description,
    coordinates: CITY_COORDINATES[draft.city] ?? CITY_COORDINATES["Naga City"],
    turnover: draft.propertyType === "Lot Only" ? "Titled, ready for construction" : "Ready for occupancy",
    features: [],
    images: [],
  };
  properties.push(property);
  persist();
  return withDelay(property);
}

/** General create/edit for Manage Properties — covers both Developer and Individual Seller sources. */
export function createProperty(input: Omit<Property, "id">): Promise<Property> {
  const property: Property = { ...input, id: `prop-${Date.now()}` };
  properties.push(property);
  persist();
  return withDelay(property);
}

export function updateProperty(
  id: string,
  input: Omit<Property, "id" | "companyId">,
): Promise<Property | undefined> {
  const property = properties.find((p) => p.id === id);
  if (property) {
    Object.assign(property, input);
    persist();
  }
  return withDelay(property);
}

export function approveListing(propertyId: string): Promise<Property | undefined> {
  const property = properties.find((p) => p.id === propertyId);
  if (property) {
    property.verificationStatus = "Verified";
    property.verificationRejectionReason = undefined;
    persist();
  }
  return withDelay(property);
}

export function rejectListing(propertyId: string, reason: string): Promise<Property | undefined> {
  const property = properties.find((p) => p.id === propertyId);
  if (property) {
    property.verificationStatus = "Rejected";
    property.verificationRejectionReason = reason;
    persist();
  }
  return withDelay(property);
}
