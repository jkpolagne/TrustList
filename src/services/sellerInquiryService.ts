import { sellerInquiries as seedInquiries } from "../mocks";
import type { ListingDraft, SellerInquiry, SellerInquiryStatus } from "../types";
import { withDelay } from "./delay";
import { loadPersisted, savePersisted } from "./persist";
import { createListingFromInquiry } from "./propertyService";

const STORAGE_KEY = "trustlist.sellerInquiries";

/** Mutable store, backed by localStorage, so status changes persist. */
const inquiries: SellerInquiry[] = loadPersisted(STORAGE_KEY, seedInquiries);

function persist(): void {
  savePersisted(STORAGE_KEY, inquiries);
}

export function getSellerInquiries(): Promise<SellerInquiry[]> {
  return withDelay(inquiries);
}

export function getSellerInquiriesByFirm(firmId: string): Promise<SellerInquiry[]> {
  return withDelay(inquiries.filter((i) => i.firmId === firmId));
}

export function getSellerInquiryById(id: string): Promise<SellerInquiry | undefined> {
  return withDelay(inquiries.find((i) => i.id === id));
}

export function submitSellerInquiry(
  input: Omit<SellerInquiry, "id" | "status" | "submittedAt">,
): Promise<SellerInquiry> {
  const inquiry: SellerInquiry = {
    ...input,
    id: `inq-${Date.now()}`,
    status: "New",
    submittedAt: new Date().toISOString(),
  };
  inquiries.push(inquiry);
  persist();
  return withDelay(inquiry);
}

export function updateSellerInquiryStatus(
  id: string,
  status: Extract<SellerInquiryStatus, "Contacted" | "Declined">,
): Promise<SellerInquiry | undefined> {
  const inquiry = inquiries.find((i) => i.id === id);
  if (inquiry) {
    inquiry.status = status;
    persist();
  }
  return withDelay(inquiry);
}

/** Converts an inquiry into a Pending Review Property listing in one step. */
export async function convertInquiryToListing(
  id: string,
  draft: ListingDraft,
): Promise<SellerInquiry | undefined> {
  const inquiry = inquiries.find((i) => i.id === id);
  if (!inquiry) return withDelay(undefined);

  const property = await createListingFromInquiry(inquiry.firmId, inquiry.name, draft);
  inquiry.status = "Converted to Listing";
  inquiry.propertyId = property.id;
  persist();
  return withDelay(inquiry);
}
