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
    computeMonthlyAmortization(loanableAmount, input.interestRatePercent, input.termYears),
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
    developerId: "dev-goldenhorizon",
    propertyId: "prop-greenview-lot14",
    bankName: "BDO Home Loans",
    listPrice: 1500000,
    downpaymentPercent: 20,
    interestRatePercent: 6.75,
    termYears: 15,
    miscFeesTotal: 45000,
  }),
  buildQuotation({
    id: "lq-riverside-4b",
    developerId: "dev-goldenhorizon",
    propertyId: "prop-riverside-4b",
    bankName: "Pag-IBIG Fund",
    listPrice: 2300000,
    downpaymentPercent: 20,
    interestRatePercent: 6.25,
    termYears: 20,
    miscFeesTotal: 62000,
  }),
  buildQuotation({
    id: "lq-sunrise-b7",
    developerId: "dev-meridian",
    propertyId: "prop-sunrise-b7",
    bankName: "BPI Family Savings Bank",
    listPrice: 1850000,
    downpaymentPercent: 15,
    interestRatePercent: 7.0,
    termYears: 15,
    miscFeesTotal: 50000,
  }),
  buildQuotation({
    id: "lq-villacorazon",
    developerId: "dev-everstone",
    propertyId: "prop-villacorazon",
    bankName: "Metrobank",
    listPrice: 4500000,
    downpaymentPercent: 20,
    interestRatePercent: 6.5,
    termYears: 20,
    miscFeesTotal: 95000,
  }),
  buildQuotation({
    id: "lq-palm-12a",
    developerId: "dev-everstone",
    propertyId: "prop-palm-12a",
    bankName: "Pag-IBIG Fund",
    listPrice: 1650000,
    downpaymentPercent: 10,
    interestRatePercent: 6.25,
    termYears: 20,
    miscFeesTotal: 48000,
  }),
];
