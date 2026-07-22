import type { Client } from "../types";

export type RequirementsState = "Incomplete" | "Basic complete" | "Complete";

/** Cash and In-House use a single simple list; only Bank Financing has the Basic/Complete split. */
export function getRequirementsState(client: Client): RequirementsState {
  if (client.paymentMethod !== "Bank Financing") {
    const allChecked =
      client.requirementsChecklist.length > 0 &&
      client.requirementsChecklist.every((item) => item.checked);
    return allChecked ? "Complete" : "Incomplete";
  }

  const basics = client.requirementsChecklist.filter((item) => item.phase === "Basic");
  const completes = client.requirementsChecklist.filter((item) => item.phase === "Complete");
  const basicDone = basics.length > 0 && basics.every((item) => item.checked);
  const completeDone = completes.length > 0 && completes.every((item) => item.checked);

  if (basicDone && completeDone) return "Complete";
  if (basicDone) return "Basic complete";
  return "Incomplete";
}
