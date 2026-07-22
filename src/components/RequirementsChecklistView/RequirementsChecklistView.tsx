import { CheckSquare, Square } from "lucide-react";
import type { Client, RequirementItem } from "../../types";
import { getRequirementsState } from "../../utils/requirements";
import "./RequirementsChecklistView.css";

interface RequirementsChecklistViewProps {
  client: Client;
}

function RequirementRow({ item }: { item: RequirementItem }) {
  return (
    <li className={`requirements-checklist-view__item${item.checked ? " requirements-checklist-view__item--checked" : ""}`}>
      {item.checked ? (
        <CheckSquare size={16} strokeWidth={2} aria-hidden="true" />
      ) : (
        <Square size={16} strokeWidth={2} aria-hidden="true" />
      )}
      <div className="requirements-checklist-view__item-text">
        <span>{item.label}</span>
        {item.checked && item.verifiedBy ? (
          <span className="requirements-checklist-view__verified">
            Verified by {item.verifiedBy}
            {item.verifiedDate ? ` · ${item.verifiedDate}` : ""}
          </span>
        ) : null}
      </div>
    </li>
  );
}

export function RequirementsChecklistView({ client }: RequirementsChecklistViewProps) {
  const state = getRequirementsState(client);
  const statePillClass =
    state === "Complete"
      ? "status-pill--positive"
      : state === "Basic complete"
        ? "status-pill--pending"
        : "status-pill--negative";

  if (client.paymentMethod !== "Bank Financing") {
    return (
      <div className="requirements-checklist-view">
        <div className="requirements-checklist-view__header">
          <span>{client.paymentMethod} requirements</span>
          <span className={`status-pill ${statePillClass}`}>{state}</span>
        </div>
        <ul className="requirements-checklist-view__list">
          {client.requirementsChecklist.map((item) => (
            <RequirementRow key={item.id} item={item} />
          ))}
        </ul>
      </div>
    );
  }

  const basics = client.requirementsChecklist.filter((item) => item.phase === "Basic");
  const completes = client.requirementsChecklist.filter((item) => item.phase === "Complete");

  return (
    <div className="requirements-checklist-view">
      <div className="requirements-checklist-view__header">
        <span>Bank Financing requirements</span>
        <span className={`status-pill ${statePillClass}`}>{state}</span>
      </div>

      <div className="requirements-checklist-view__phase requirements-checklist-view__phase--basic">
        <span className="requirements-checklist-view__phase-title">
          Basic — required for Tranche 1
        </span>
        <ul className="requirements-checklist-view__list">
          {basics.map((item) => (
            <RequirementRow key={item.id} item={item} />
          ))}
        </ul>
      </div>

      <div className="requirements-checklist-view__phase requirements-checklist-view__phase--complete">
        <span className="requirements-checklist-view__phase-title">
          Complete — required for later tranches
        </span>
        <ul className="requirements-checklist-view__list">
          {completes.map((item) => (
            <RequirementRow key={item.id} item={item} />
          ))}
        </ul>
      </div>
    </div>
  );
}
