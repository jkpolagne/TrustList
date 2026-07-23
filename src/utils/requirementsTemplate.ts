import type { EmploymentStatus, PaymentMethod, RequirementItem } from "../types";

function item(id: string, label: string, phase: "Basic" | "Complete" = "Basic"): RequirementItem {
  return { id, label, phase, checked: false };
}

/** Builds a fresh, all-unchecked requirements checklist for a new client, per
 * CLAUDE.md's Requirements checklist section — Cash and In-House get a simple
 * list; Bank Financing gets the Basic/Complete split by employment status. */
export function buildRequirementsChecklist(
  paymentMethod: PaymentMethod,
  employmentStatus: EmploymentStatus,
  clientId: string,
): RequirementItem[] {
  const p = (n: number) => `req-${clientId}-${n}`;

  if (paymentMethod === "Cash") {
    return [item(p(1), "Valid government ID"), item(p(2), "Declaration of source of funds")];
  }

  if (paymentMethod === "In-House") {
    return [item(p(1), "Proof of income"), item(p(2), "Valid government ID")];
  }

  if (employmentStatus === "Locally Employed") {
    return [
      item(p(1), "2 valid government IDs", "Basic"),
      item(p(2), "Certificate of Employment with Compensation", "Basic"),
      item(p(3), "Payslips (3 months)", "Basic"),
      item(p(4), "Income Tax Return (ITR)", "Basic"),
      item(p(5), "Birth certificate", "Complete"),
      item(p(6), "Marriage contract (if married)", "Complete"),
      item(p(7), "Proof of billing", "Complete"),
      item(p(8), "Verified TIN", "Complete"),
    ];
  }

  if (employmentStatus === "OFW") {
    return [
      item(p(1), "2 valid government IDs", "Basic"),
      item(p(2), "Employment contract / salary certificate", "Basic"),
      item(p(3), "Payslips or payroll bank statements", "Basic"),
      item(p(4), "Passport with entry-exit stamps", "Basic"),
      item(p(5), "Birth certificate", "Complete"),
      item(p(6), "Marriage contract (if married)", "Complete"),
      item(p(7), "Proof of billing", "Complete"),
      item(p(8), "Verified TIN", "Complete"),
      item(p(9), "Special Power of Attorney", "Complete"),
    ];
  }

  // Self-Employed
  return [
    item(p(1), "2 valid government IDs", "Basic"),
    item(p(2), "Income Tax Return (2 years)", "Basic"),
    item(p(3), "Bank statements (6 months)", "Basic"),
    item(p(4), "Birth certificate", "Complete"),
    item(p(5), "Marriage contract (if married)", "Complete"),
    item(p(6), "Audited financial statements (2 years)", "Complete"),
    item(p(7), "DTI registration", "Complete"),
    item(p(8), "Mayor's Permit", "Complete"),
    item(p(9), "Proof of billing", "Complete"),
    item(p(10), "Verified TIN", "Complete"),
    item(p(11), "Business photo", "Complete"),
  ];
}
