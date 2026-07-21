import { CalendarClock, Check, X as XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import {
  getConsultantsByFirm,
  getPropertiesByFirm,
  getVisitRequestsByFirm,
  updateVisitRequestStatus,
} from "../services";
import type { Consultant, Property, VisitRequest, VisitRequestStatus } from "../types";
import "./ManageVisitSchedules.css";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ManageVisitSchedules() {
  const { session } = useAuth();
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"All" | VisitRequestStatus>("All");
  const [busyId, setBusyId] = useState<string | null>(null);

  function reload() {
    if (!session?.firmId) return;
    Promise.all([
      getVisitRequestsByFirm(session.firmId),
      getPropertiesByFirm(session.firmId),
      getConsultantsByFirm(session.firmId),
    ]).then(([visitsData, propertiesData, consultantsData]) => {
      setVisits(
        [...visitsData].sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
        ),
      );
      setProperties(propertiesData);
      setConsultants(consultantsData);
      setLoading(false);
    });
  }

  useEffect(reload, [session?.firmId]);

  const propertiesById = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);
  const consultantsById = useMemo(() => new Map(consultants.map((c) => [c.id, c])), [consultants]);

  const filtered = useMemo(
    () => visits.filter((v) => statusFilter === "All" || v.status === statusFilter),
    [visits, statusFilter],
  );

  async function handleDecision(id: string, status: "Approved" | "Declined") {
    setBusyId(id);
    await updateVisitRequestStatus(id, status);
    setBusyId(null);
    reload();
  }

  return (
    <div className="manage-visits-page">
      <header className="manage-visits-page__header">
        <h1>Visit Schedules</h1>
        <p>Requests submitted through the public hub's Schedule Visit form.</p>
      </header>

      <div className="admin-toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Declined">Declined</option>
        </select>
      </div>

      {loading ? (
        <Skeleton height={320} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No visit requests"
          description="Requests submitted from a property's Schedule Visit form will show up here."
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Requester</th>
                <th>Property</th>
                <th>Preferred Visit</th>
                <th>Referred By</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((visit) => (
                <tr key={visit.id}>
                  <td>{formatDate(visit.submittedAt)}</td>
                  <td>
                    <div className="manage-visits-page__requester">
                      <span>{visit.name}</span>
                      <span>{visit.phone}</span>
                    </div>
                  </td>
                  <td>{propertiesById.get(visit.propertyId)?.title ?? visit.propertyId}</td>
                  <td>
                    {formatDate(visit.preferredDate)} · {visit.preferredTime}
                  </td>
                  <td>
                    {visit.consultantId ? (
                      (consultantsById.get(visit.consultantId)?.name ?? "—")
                    ) : (
                      <span className="manage-visits-page__no-referral">Direct</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        visit.status === "Approved"
                          ? "status-pill--positive"
                          : visit.status === "Declined"
                            ? "status-pill--negative"
                            : "status-pill--pending"
                      }`}
                    >
                      {visit.status}
                    </span>
                  </td>
                  <td>
                    {visit.status === "Pending" ? (
                      <div className="manage-visits-page__actions">
                        <button
                          type="button"
                          className="manage-visits-page__approve"
                          onClick={() => handleDecision(visit.id, "Approved")}
                          disabled={busyId === visit.id}
                          aria-label={`Approve visit request from ${visit.name}`}
                        >
                          <Check size={14} strokeWidth={2} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="manage-visits-page__decline"
                          onClick={() => handleDecision(visit.id, "Declined")}
                          disabled={busyId === visit.id}
                          aria-label={`Decline visit request from ${visit.name}`}
                        >
                          <XIcon size={14} strokeWidth={2} aria-hidden="true" />
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
