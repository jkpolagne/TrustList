import type { LoanQuotation } from "../types";
import { buildAmortizationOptions, computeMonthlyAmortization } from "../utils/finance";

type QuotationInput = Omit<
  LoanQuotation,
  | "downpaymentAmount"
  | "downpaymentBalanceAfterReservation"
  | "monthlyEquity"
  | "loanableAmount"
  | "monthlyAmortization"
  | "amortizationOptions"
  | "totalContractPrice"
>;

function buildQuotation(input: QuotationInput): LoanQuotation {
  const downpaymentAmount = Math.round(input.listPrice * (input.downpaymentPercent / 100));
  const downpaymentBalanceAfterReservation = Math.max(0, downpaymentAmount - input.reservationFee);
  const monthlyEquity = Math.round(downpaymentBalanceAfterReservation / input.downpaymentTermMonths);
  const loanableAmount = input.listPrice - downpaymentAmount;
  const monthlyAmortization = Math.round(
    computeMonthlyAmortization(loanableAmount, input.interestRatePercent, input.termMonths),
  );
  const amortizationOptions = buildAmortizationOptions(loanableAmount, input.interestRatePercent);
  const totalContractPrice = input.listPrice + input.miscFeesTotal;

  return {
    ...input,
    downpaymentAmount,
    downpaymentBalanceAfterReservation,
    monthlyEquity,
    loanableAmount,
    monthlyAmortization,
    amortizationOptions,
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
    reservationFee: 20000,
    downpaymentPercent: 20,
    downpaymentTermMonths: 12,
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
    reservationFee: 25000,
    downpaymentPercent: 20,
    downpaymentTermMonths: 24,
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
    reservationFee: 25000,
    downpaymentPercent: 15,
    downpaymentTermMonths: 12,
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
    reservationFee: 50000,
    downpaymentPercent: 20,
    downpaymentTermMonths: 24,
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
    reservationFee: 20000,
    downpaymentPercent: 10,
    downpaymentTermMonths: 12,
    interestRatePercent: 6.25,
    termMonths: 240,
    miscFeesTotal: 48000,
    breakdownDescription: "10% downpayment, 20-year term through Pag-IBIG Fund financing.",
  }),
];
