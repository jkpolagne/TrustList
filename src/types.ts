export type FirmStatus = "Active" | "Suspended";

export interface Firm {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  email: string;
  contactNumber: string;
  isPrimary?: boolean;
  status: FirmStatus;
}

export interface CompanyAdminAccount {
  id: string;
  firmId: string;
  name: string;
  email: string;
  /** Mock only — a real backend would never store this in plain text. */
  temporaryPassword: string;
  createdAt: string;
}

export type PlatformLogEventType =
  | "Firm Onboarded"
  | "Firm Status Changed"
  | "Company Admin Created";

export interface PlatformLogEntry {
  id: string;
  timestamp: string;
  eventType: PlatformLogEventType;
  firmId?: string;
  message: string;
}

export interface CommissionSplit {
  broker: number;
  salesManager: number;
  salesPerson: number;
}

export type DeveloperStatus = "Active" | "Inactive";

export interface RequiredMilestonePercents {
  cash: number;
  inHouse: number;
  bank: number;
}

export interface Developer {
  id: string;
  companyId: string;
  name: string;
  status: DeveloperStatus;
  totalCutPercent: number;
  commissionRates: {
    direct: CommissionSplit;
    referred: CommissionSplit;
  };
  /** Minimum % of contract price paid before the first commission tranche is due, per method. */
  requiredMilestonePercent: RequiredMilestonePercents;
}

export type ListingSource = "Developer" | "Individual Seller";
export type VerificationStatus = "Pending Review" | "Verified" | "Rejected";
export type PropertyStatus = "Available" | "Reserved" | "Sold";
export type PropertyType = "Lot Only" | "House" | "Townhouse" | "Condominium";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Property {
  id: string;
  companyId: string;
  developerId?: string;
  title: string;
  propertyType: PropertyType;
  city: string;
  address: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  lotAreaSqm?: number;
  floorAreaSqm?: number;
  isLotOnly: boolean;
  status: PropertyStatus;
  listingSource: ListingSource;
  verificationStatus?: VerificationStatus;
  verificationDocuments?: string[];
  verificationRejectionReason?: string;
  description: string;
  coordinates: Coordinates;
  turnover: string;
  /** Only meaningful for House/Townhouse/Condominium — hidden in the UI for Lot Only. */
  houseModel?: string;
  features: string[];
  /** Mock filenames standing in for uploaded listing photos. */
  images: string[];
}

export type PrcLicenseStatus = "Verified" | "Pending" | "Unverified";
export type ConsultantRole = "Broker" | "Sales Manager" | "Sales Person";
export type ConsultantAccountStatus = "Active" | "Inactive";
export type ConsultantLinkStatus = "Active" | "Inactive";

export interface Consultant {
  id: string;
  companyId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  /** Derived from first/middle/last on every create or edit — kept so existing display code stays simple. */
  name: string;
  role: ConsultantRole;
  /** Broker id (for Sales Manager) or Sales Manager id (for Sales Person). Never set for Broker. */
  reportsTo?: string;
  prcLicenseNumber: string;
  prcLicenseStatus: PrcLicenseStatus;
  /** Mock only — a real backend would never store this in plain text. */
  password: string;
  accountStatus: ConsultantAccountStatus;
  /** Set only for Sales Manager / Sales Person — Brokers never get a consultant link. */
  linkCode?: string;
  linkStatus?: ConsultantLinkStatus;
  email: string;
  phone: string;
}

export type EmploymentStatus = "OFW" | "Locally Employed" | "Self-Employed";
export type PaymentMethod = "Cash" | "In-House" | "Bank Financing";
export type SaleType = "Direct" | "Referred";
export type ClientStatus = "Active" | "Fully Released";
export type RequirementPhase = "Basic" | "Complete";

export interface RequirementItem {
  id: string;
  label: string;
  phase: RequirementPhase;
  checked: boolean;
  verifiedBy?: string;
  verifiedDate?: string;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  contactNumber: string;
  email: string;
  employmentStatus: EmploymentStatus;
  propertyId: string;
  consultantId: string;
  saleType: SaleType;
  paymentMethod: PaymentMethod;
  contractPrice: number;
  totalTranches: number;
  currentTranche: number;
  amountPaid: number;
  status: ClientStatus;
  requirementsChecklist: RequirementItem[];
}

export type InternalRole =
  | "Super Admin"
  | "Company Admin"
  | "Broker"
  | "Sales Manager"
  | "Sales Person";

export interface Session {
  role: InternalRole;
  firmId?: string;
  consultantId?: string;
  displayName: string;
}

export interface LoanQuotation {
  id: string;
  companyId: string;
  developerId: string;
  propertyId: string;
  bankName: string;
  listPrice: number;
  downpaymentPercent: number;
  downpaymentAmount: number;
  loanableAmount: number;
  interestRatePercent: number;
  termMonths: number;
  monthlyAmortization: number;
  miscFeesTotal: number;
  totalContractPrice: number;
  breakdownDescription: string;
}

export type VisitRequestStatus = "Pending" | "Approved" | "Declined";

export interface VisitRequest {
  id: string;
  companyId: string;
  propertyId: string;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
  status: VisitRequestStatus;
  submittedAt: string;
  /** The consultant whose link this session was attributed to, if any. */
  consultantId?: string;
}

export type SellerPropertyType = "House and Lot" | "Lot Only";
export type SellerInquiryStatus = "New" | "Contacted" | "Converted to Listing" | "Declined";

export interface SellerInquiry {
  id: string;
  firmId: string;
  name: string;
  contactNumber: string;
  email: string;
  propertyLocation: string;
  propertyType: SellerPropertyType;
  description: string;
  status: SellerInquiryStatus;
  submittedAt: string;
  /** Set once the inquiry is converted — links to the resulting Property record. */
  propertyId?: string;
}

export interface ListingDraft {
  title: string;
  city: string;
  address: string;
  price: number;
  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  lotAreaSqm?: number;
  floorAreaSqm?: number;
  description: string;
}
