import { consultants, firms } from "../mocks";
import type { InternalRole, Session } from "../types";
import { withDelay } from "./delay";

const ROLE_DISPLAY_NAMES: Record<InternalRole, string> = {
  "Super Admin": "Platform Admin",
  "Company Admin": "Company Admin",
  Broker: "Broker",
  "Sales Manager": "Sales Manager",
  "Sales Person": "Sales Person",
};

/** Simulated login — no real authentication, resolves a Session from mock data. */
export function login(
  role: InternalRole,
  firmId?: string,
  consultantId?: string,
): Promise<Session> {
  let displayName = ROLE_DISPLAY_NAMES[role];

  if (consultantId) {
    const consultant = consultants.find((c) => c.id === consultantId);
    if (consultant) displayName = consultant.name;
  } else if (firmId) {
    const firm = firms.find((f) => f.id === firmId);
    if (firm) displayName = `${role} · ${firm.name}`;
  }

  return withDelay({ role, firmId, consultantId, displayName });
}
