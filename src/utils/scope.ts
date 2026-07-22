import type { Consultant, InternalRole } from "../types";

/** Sales Person sees only themself; Sales Manager sees themself plus everyone reporting to them.
 * Accepts the broader InternalRole since callers pass session.role directly — routes calling this
 * are already gated to Sales Manager / Sales Person via RequireRole. */
export function getScopedConsultantIds(
  consultantId: string,
  role: InternalRole,
  allConsultants: Consultant[],
): string[] {
  if (role !== "Sales Manager") return [consultantId];
  const team = allConsultants
    .filter((c) => c.reportsTo === consultantId)
    .map((c) => c.id);
  return [consultantId, ...team];
}
