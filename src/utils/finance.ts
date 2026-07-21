export function computeMonthlyAmortization(
  principal: number,
  annualRatePercent: number,
  termMonths: number,
): number {
  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
}

export function formatPHP(amount: number): string {
  return `₱${Math.round(amount).toLocaleString("en-PH")}`;
}
