/** Every payment method's tranches are evenly spaced across 100% of contract price
 * (Cash is a single 100% tranche; In-House and Bank Financing split into 4 even tranches). */
export function computeTrancheFromAmount(
  amountPaid: number,
  contractPrice: number,
  totalTranches: number,
): number {
  if (contractPrice <= 0) return 0;
  if (totalTranches <= 1) return amountPaid >= contractPrice ? 1 : 0;

  const percentPaid = (amountPaid / contractPrice) * 100;
  const trancheSize = 100 / totalTranches;
  const tranche = Math.floor(percentPaid / trancheSize + 1e-9);
  return Math.max(0, Math.min(totalTranches, tranche));
}

export function daysSince(dateStr: string, reference: Date = new Date()): number {
  const then = new Date(dateStr).getTime();
  const now = reference.getTime();
  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

const AGING_THRESHOLD_DAYS = 7;

export function isMilestoneAging(detectedDate: string, reference: Date = new Date()): boolean {
  return daysSince(detectedDate, reference) > AGING_THRESHOLD_DAYS;
}

export type PayoutAgingTier = "fresh" | "amber" | "red";

/** Expected Developer Payout uses a stricter 3-tier aging read than the plain milestone
 * card: amber past 7 days, red past 14 — the anti-"walang transmittal" signal. */
export function getPayoutAgingTier(detectedDate: string, reference: Date = new Date()): PayoutAgingTier {
  const days = daysSince(detectedDate, reference);
  if (days > 14) return "red";
  if (days > 7) return "amber";
  return "fresh";
}
