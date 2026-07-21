import type { LoanQuotation } from "../types";
import { computeMonthlyAmortization } from "../utils/finance";

type QuotationInput = Omit<
  LoanQuotation,
  "downpaymentAmount" | "loanableAmount" | "monthlyAmortization" | "totalContractPrice"
>;

function buildQuotation(input: QuotationInput): LoanQuotation {
  const downpaymentAmount = Math.round(input.listPrice * (input.downpaymentPercent / 100));
  const loanableAmount = input.listPrice - downpaymentAmount;
  const monthlyAmortization = Math.round(
    computeMonthlyAmortization(loanableAmount, input.interestRatePercent, input.termMonths),
  );
  const totalContractPrice = input.listPrice + input.miscFeesTotal;

  return {
    ...input,
    downpaymentAmount,
    loanableAmount,
    monthlyAmortization,
    totalContractPrice,
  };
}

export const loanQuotations: LoanQuotation[] = [
  buildQuotation({
    id: "lq-greenview-lot14",
    companyId: "firm-advench",
    developerId: "dev-goldenhorizon",
    propertyId: "prop-greenview-lot14",
    bankName: "BDO Home Loans",
    listPrice: 1500000,
    downpaymentPercent: 20,
    interestRatePercent: 6.75,
    termMonths: 180,
    miscFeesTotal: 45000,
    breakdownDescription: "20% downpayment, 15-year fixed term with BDO Home Loans.",
  }),
  buildQuotation({
    id: "lq-riverside-4b",
    companyId: "firm-advench",
    developerId: "dev-goldenhorizon",
    propertyId: "prop-riverside-4b",
    bankName: "Pag-IBIG Fund",
    listPrice: 2300000,
    downpaymentPercent: 20,
    interestRatePercent: 6.25,
    termMonths: 240,
    miscFeesTotal: 62000,
    breakdownDescription: "20% downpayment, 20-year term through Pag-IBIG Fund financing.",
  }),
  buildQuotation({
    id: "lq-sunrise-b7",
    companyId: "firm-bicolhomes",
    developerId: "dev-meridian",
    propertyId: "prop-sunrise-b7",
    bankName: "BPI Family Savings Bank",
    listPrice: 1850000,
    downpaymentPercent: 15,
    interestRatePercent: 7.0,
    termMonths: 180,
    miscFeesTotal: 50000,
    breakdownDescription: "15% downpayment, 15-year term with BPI Family Savings Bank.",
  }),
  buildQuotation({
    id: "lq-villacorazon",
    companyId: "firm-coastline",
    developerId: "dev-everstone",
    propertyId: "prop-villacorazon",
    bankName: "Metrobank",
    listPrice: 4500000,
    downpaymentPercent: 20,
    interestRatePercent: 6.5,
    termMonths: 240,
    miscFeesTotal: 95000,
    breakdownDescription: "20% downpayment, 20-year term with Metrobank home loan.",
  }),
  buildQuotation({
    id: "lq-palm-12a",
    companyId: "firm-coastline",
    developerId: "dev-everstone",
    propertyId: "prop-palm-12a",
    bankName: "Pag-IBIG Fund",
    listPrice: 1650000,
    downpaymentPercent: 10,
    interestRatePercent: 6.25,
    termMonths: 240,
    miscFeesTotal: 48000,
    breakdownDescription: "10% downpayment, 20-year term through Pag-IBIG Fund financing.",
  }),
];
