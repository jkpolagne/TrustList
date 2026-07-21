export type FirmStatus = "Active" | "Suspended";

export interface Firm {
  id: string;
  name: string;
  city: string;
  isPrimary?: boolean;
  status: FirmStatus;
}

export interface CommissionSplit {
  broker: number;
  salesManager: number;
  salesPerson: number;
}

export interface Developer {
  id: string;
  companyId: string;
  name: string;
  commissionRates: {
    direct: CommissionSplit;
    referred: CommissionSplit;
  };
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
  description: string;
  coordinates: Coordinates;
  turnover: string;
  features: string[];
}

export type PrcLicenseStatus = "Verified" | "Pending" | "Unverified";
export type ConsultantRole = "Broker" | "Sales Manager" | "Sales Person";

export interface Consultant {
  id: string;
  companyId: string;
  name: string;
  role: ConsultantRole;
  reportsTo?: string;
  prcLicenseNumber: string;
  prcLicenseStatus: PrcLicenseStatus;
  linkCode?: string;
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
  developerId: string;
  propertyId: string;
  bankName: string;
  listPrice: number;
  downpaymentPercent: number;
  downpaymentAmount: number;
  loanableAmount: number;
  interestRatePercent: number;
  termYears: number;
  monthlyAmortization: number;
  miscFeesTotal: number;
  totalContractPrice: number;
}

export interface VisitRequest {
  id: string;
  propertyId: string;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
  submittedAt: string;
}
