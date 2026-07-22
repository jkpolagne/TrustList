import type { VoucherStatus } from "../types";

export function voucherStatusPillClass(status: VoucherStatus): string {
  if (status === "Released") return "status-pill--positive";
  if (status === "Disputed") return "status-pill--negative";
  return "status-pill--pending";
}
