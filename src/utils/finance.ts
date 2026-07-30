import type { AmortizationOption } from "../types";

export function computeMonthlyAmortization(
  principal: number,
  annualRatePercent: number,
  termMonths: number,
): number {
  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
}

/** The term lengths every real bank/developer quotation sheet shows side by side. */
export const STANDARD_LOAN_TERM_YEARS = [5, 10, 15, 20];

export function buildAmortizationOptions(loanableAmount: number, annualRatePercent: number): AmortizationOption[] {
  return STANDARD_LOAN_TERM_YEARS.map((termYears) => ({
    termYears,
    monthlyAmortization: Math.round(computeMonthlyAmortization(loanableAmount, annualRatePercent, termYears * 12)),
  }));
}

export function formatPHP(amount: number): string {
  return `₱${Math.round(amount).toLocaleString("en-PH")}`;
}
