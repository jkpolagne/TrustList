export function computeMonthlyAmortization(
  principal: number,
  annualRatePercent: number,
  termYears: number,
): number {
  const monthlyRate = annualRatePercent / 100 / 12;
  const totalMonths = termYears * 12;
  if (monthlyRate === 0) return principal / totalMonths;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalMonths));
}

export function formatPHP(amount: number): string {
  return `₱${Math.round(amount).toLocaleString("en-PH")}`;
}
