import { properties as seedProperties } from "../mocks";
import type { HazardInfo, ListingDraft, Property } from "../types";
import { withDelay } from "./delay";
import { loadPersisted, savePersisted } from "./persist";

const STORAGE_KEY = "trustlist.properties";

/** Conservative placeholder for a listing with no assessed hazard data yet — never
 * claims "Low" for an unassessed location, consistent with the trust theme. */
const UNASSESSED_HAZARD_INFO: HazardInfo = {
  floodRisk: "Moderate",
  stormSurgeRisk: "Not Applicable",
  landslideRisk: "Low",
  nearestEvacuationCenter: "To be confirmed by the firm",
  dataSource: "Based on PHIVOLCS and PAGASA hazard maps — verify with local government for updated data",
};

/** Backfills fields added to the Property model after a browser may have already cached
 * older records in localStorage — without this, a stale cached property missing e.g.
 * `amenities` crashes any component that calls `.length` on it (no error boundary exists,
 * so one bad property blanks the whole page). Every read of the store goes through this. */
function normalizeProperty(p: Property): Property {
  return {
    ...p,
    titleType: p.titleType ?? "Clean Title (Transfer Certificate of Title)",
    features: p.features ?? [],
    amenities: p.amenities ?? [],
    nearbyLandmarks: p.nearbyLandmarks ?? [],
    images: p.images ?? [],
    hazardInfo: p.hazardInfo ?? UNASSESSED_HAZARD_INFO,
  };
}

/** Mutable store, backed by localStorage, so admin actions (approve/reject/convert) persist. */
const properties: Property[] = loadPersisted(STORAGE_KEY, seedProperties).map(normalizeProperty);

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
    // No structured barangay from a seller inquiry's free-text location — admin can
    // fill this in later via Manage Properties to enable the zonal valuation estimate.
    barangay: "",
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
    // A freshly-submitted seller inquiry has no verified paper trail yet — Tax
    // Declaration Only is the honest default until the firm reviews the actual title.
    titleType: "Tax Declaration Only",
    features: [],
    amenities: [],
    nearbyLandmarks: [],
    images: [],
    hazardInfo: UNASSESSED_HAZARD_INFO,
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
