import { CalendarClock, Check, UserPlus, X as XIcon } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import {
  convertVisitToClient,
  getConsultantsByFirm,
  getPropertiesByFirm,
  getVisitRequestsByFirm,
  updateVisitRequestStatus,
} from "../services";
import type {
  Consultant,
  EmploymentStatus,
  PaymentMethod,
  Property,
  VisitRequest,
  VisitRequestStatus,
} from "../types";
import { formatPHP } from "../utils/finance";
import "./ManageVisitSchedules.css";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "In-House", "Bank Financing"];
const EMPLOYMENT_STATUSES: EmploymentStatus[] = ["Locally Employed", "OFW", "Self-Employed"];

export function ManageVisitSchedules() {
  const { session } = useAuth();
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"All" | VisitRequestStatus>("All");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [convertVisit, setConvertVisit] = useState<VisitRequest | null>(null);
  const [consultantId, setConsultantId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>("Locally Employed");
  const [contractPrice, setContractPrice] = useState("");
  const [reservationDate, setReservationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [converting, setConverting] = useState(false);

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
  const assignableConsultants = useMemo(
    () => consultants.filter((c) => c.role === "Sales Manager" || c.role === "Sales Person"),
    [consultants],
  );

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

  function openConvertModal(visit: VisitRequest) {
    setConvertVisit(visit);
    setConsultantId(visit.consultantId ?? "");
    setPaymentMethod("Cash");
    setEmploymentStatus("Locally Employed");
    setContractPrice(String(propertiesById.get(visit.propertyId)?.price ?? ""));
    setReservationDate(new Date().toISOString().slice(0, 10));
  }

  async function handleConvertSubmit(e: FormEvent) {
    e.preventDefault();
    if (!convertVisit || !session?.displayName || !consultantId) return;
    const consultant = consultantsById.get(consultantId);
    if (!consultant) return;

    setConverting(true);
    await convertVisitToClient(
      convertVisit.id,
      {
        consultantId,
        saleType: consultant.role === "Sales Person" ? "Referred" : "Direct",
        paymentMethod,
        employmentStatus,
        contractPrice: Number(contractPrice),
        reservationDate,
      },
      session.displayName,
    );
    setConverting(false);
    setConvertVisit(null);
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
                    ) : visit.status === "Approved" && visit.clientId ? (
                      <span className="manage-visits-page__converted">
                        <Check size={13} strokeWidth={2} aria-hidden="true" />
                        Converted to Client
                      </span>
                    ) : visit.status === "Approved" ? (
                      <button
                        type="button"
                        className="manage-visits-page__convert"
                        onClick={() => openConvertModal(visit)}
                      >
                        <UserPlus size={13} strokeWidth={2} aria-hidden="true" />
                        Convert to Client
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(convertVisit)}
        title={`Convert to Client — ${convertVisit?.name ?? ""}`}
        onClose={() => setConvertVisit(null)}
        width={520}
      >
        <form className="admin-form" onSubmit={handleConvertSubmit}>
          <p className="admin-form__hint">
            Creates a monitored Client record for {convertVisit?.name} against{" "}
            {propertiesById.get(convertVisit?.propertyId ?? "")?.title ?? "this property"}. They'll
            appear in the assigned consultant's Monitor Clients right away.
          </p>

          <div className="admin-form__field">
            <label htmlFor="convertConsultant">Assigned consultant</label>
            <select
              id="convertConsultant"
              required
              value={consultantId}
              onChange={(e) => setConsultantId(e.target.value)}
            >
              <option value="">Choose a consultant…</option>
              {assignableConsultants.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role})
                </option>
              ))}
            </select>
          </div>

          <div className="admin-form__row">
            <div className="admin-form__field">
              <label htmlFor="convertPaymentMethod">Payment method</label>
              <select
                id="convertPaymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-form__field">
              <label htmlFor="convertEmployment">Employment status</label>
              <select
                id="convertEmployment"
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus)}
              >
                {EMPLOYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-form__row">
            <div className="admin-form__field">
              <label htmlFor="convertContractPrice">Contract price (₱)</label>
              <input
                id="convertContractPrice"
                type="number"
                min={0}
                step={10000}
                required
                value={contractPrice}
                onChange={(e) => setContractPrice(e.target.value)}
              />
            </div>
            <div className="admin-form__field">
              <label htmlFor="convertReservationDate">Reservation date</label>
              <input
                id="convertReservationDate"
                type="date"
                required
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
              />
            </div>
          </div>

          {contractPrice ? (
            <p className="admin-form__hint">
              Contract price: <strong className="money">{formatPHP(Number(contractPrice) || 0)}</strong>
            </p>
          ) : null}

          <div className="admin-form__actions">
            <button
              type="button"
              className="admin-form__cancel"
              onClick={() => setConvertVisit(null)}
              disabled={converting}
            >
              Cancel
            </button>
            <button type="submit" className="admin-form__submit" disabled={converting || !consultantId}>
              {converting ? "Creating…" : "Create Client"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
