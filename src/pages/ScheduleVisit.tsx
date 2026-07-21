import { CheckCircle2, ChevronLeft, SearchX } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { useReferral } from "../context/ReferralContext";
import { getFirmById, getPublicPropertyById, submitVisitRequest } from "../services";
import type { Firm, Property } from "../types";
import "./ScheduleVisit.css";

export function ScheduleVisit() {
  const { id } = useParams<{ id: string }>();
  const { consultant } = useReferral();
  const [property, setProperty] = useState<Property | null | undefined>(undefined);
  const [firm, setFirm] = useState<Firm | undefined>();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPublicPropertyById(id).then((found) => {
      setProperty(found ?? null);
      if (found) getFirmById(found.companyId).then(setFirm);
    });
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    await submitVisitRequest({
      propertyId: id,
      name,
      email,
      phone,
      preferredDate,
      preferredTime,
      notes: notes || undefined,
      consultantId:
        consultant && property && consultant.companyId === property.companyId
          ? consultant.id
          : undefined,
    });
    setSubmitting(false);
    setSubmitted(true);
  }

  if (property === undefined) {
    return (
      <div className="schedule-visit">
        <Skeleton height={28} width="40%" style={{ marginBottom: 20 }} />
        <Skeleton height={360} />
      </div>
    );
  }

  if (property === null) {
    return (
      <EmptyState
        icon={SearchX}
        title="Listing not found"
        description="This property may have been removed or the link is incorrect."
        action={
          <Link to="/" className="schedule-visit__back">
            <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
            Back to listings
          </Link>
        }
      />
    );
  }

  return (
    <div className="schedule-visit">
      <Link to={`/properties/${property.id}`} className="schedule-visit__back">
        <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
        Back to listing
      </Link>

      <h1>Schedule a Visit</h1>
      <p className="schedule-visit__subtitle">
        {property.title} · {firm?.name ?? "—"}
      </p>

      {submitted ? (
        <div className="schedule-visit__confirmation">
          <CheckCircle2 size={32} strokeWidth={1.75} aria-hidden="true" />
          <h3>Your visit request has been sent</h3>
          <p>
            {firm?.name ?? "The firm"} will contact you at {phone || "your provided number"} to
            confirm your preferred schedule. No live chat — just wait for their call or email.
          </p>
          <Link to={`/properties/${property.id}`} className="schedule-visit__confirmation-link">
            Back to listing
          </Link>
        </div>
      ) : (
        <form className="schedule-visit__form" onSubmit={handleSubmit}>
          <div className="schedule-visit__field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="schedule-visit__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="schedule-visit__field">
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              type="tel"
              required
              placeholder="09XX-XXX-XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="schedule-visit__field-row">
            <div className="schedule-visit__field">
              <label htmlFor="date">Preferred date</label>
              <input
                id="date"
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </div>
            <div className="schedule-visit__field">
              <label htmlFor="time">Preferred time</label>
              <input
                id="time"
                type="time"
                required
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
              />
            </div>
          </div>

          <div className="schedule-visit__field">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the firm should know before your visit"
            />
          </div>

          <button type="submit" className="schedule-visit__submit" disabled={submitting}>
            {submitting ? "Sending…" : "Request Visit"}
          </button>
        </form>
      )}
    </div>
  );
}
