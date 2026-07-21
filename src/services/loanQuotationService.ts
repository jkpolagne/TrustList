import { loanQuotations as seedQuotations } from "../mocks";
import type { LoanQuotation } from "../types";
import { computeMonthlyAmortization } from "../utils/finance";
import { withDelay } from "./delay";
import { loadPersisted, savePersisted } from "./persist";

const STORAGE_KEY = "trustlist.loanQuotations";

const loanQuotations: LoanQuotation[] = loadPersisted(STORAGE_KEY, seedQuotations);

function persist(): void {
  savePersisted(STORAGE_KEY, loanQuotations);
}

export function getLoanQuotations(): Promise<LoanQuotation[]> {
  return withDelay(loanQuotations);
}

export function getLoanQuotationsByDeveloper(developerId: string): Promise<LoanQuotation[]> {
  return withDelay(loanQuotations.filter((q) => q.developerId === developerId));
}

export function getLoanQuotationsByFirm(companyId: string): Promise<LoanQuotation[]> {
  return withDelay(loanQuotations.filter((q) => q.companyId === companyId));
}

export function getLoanQuotationByProperty(propertyId: string): Promise<LoanQuotation | undefined> {
  return withDelay(loanQuotations.find((q) => q.propertyId === propertyId));
}

type QuotationInput = Omit<
  LoanQuotation,
  "id" | "downpaymentAmount" | "loanableAmount" | "monthlyAmortization" | "totalContractPrice"
>;

export function createLoanQuotation(input: QuotationInput): Promise<LoanQuotation> {
  const downpaymentAmount = Math.round(input.listPrice * (input.downpaymentPercent / 100));
  const loanableAmount = input.listPrice - downpaymentAmount;
  const totalContractPrice = input.listPrice + input.miscFeesTotal;
  const monthlyAmortization = Math.round(
    computeMonthlyAmortization(loanableAmount, input.interestRatePercent, input.termMonths),
  );

  const quotation: LoanQuotation = {
    ...input,
    id: `lq-${Date.now()}`,
    downpaymentAmount,
    loanableAmount,
    totalContractPrice,
    monthlyAmortization,
  };
  loanQuotations.push(quotation);
  persist();
  return withDelay(quotation);
}
