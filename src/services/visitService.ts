import type { VisitRequest } from "../types";
import { withDelay } from "./delay";

const submittedVisits: VisitRequest[] = [];

export function submitVisitRequest(
  input: Omit<VisitRequest, "id" | "submittedAt">,
): Promise<VisitRequest> {
  const visit: VisitRequest = {
    ...input,
    id: `visit-${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
  submittedVisits.push(visit);
  return withDelay(visit);
}
