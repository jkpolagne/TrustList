import { loanQuotations } from "../mocks";
import type { LoanQuotation } from "../types";
import { withDelay } from "./delay";

export function getLoanQuotations(): Promise<LoanQuotation[]> {
  return withDelay(loanQuotations);
}

export function getLoanQuotationsByDeveloper(developerId: string): Promise<LoanQuotation[]> {
  return withDelay(loanQuotations.filter((q) => q.developerId === developerId));
}

export function getLoanQuotationByProperty(propertyId: string): Promise<LoanQuotation | undefined> {
  return withDelay(loanQuotations.find((q) => q.propertyId === propertyId));
}
