import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "../components/Skeleton";
import { getFirms, submitSellerInquiry } from "../services";
import type { Firm, SellerPropertyType } from "../types";
import "./SellProperty.css";

export function SellProperty() {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loadingFirms, setLoadingFirms] = useState(true);

  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [propertyType, setPropertyType] = useState<SellerPropertyType>("House and Lot");
  const [description, setDescription] = useState("");
  const [firmId, setFirmId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getFirms().then((data) => {
      setFirms(data);
      setFirmId(data[0]?.id ?? "");
      setLoadingFirms(false);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await submitSellerInquiry({
      firmId,
      name,
      contactNumber,
      email,
      propertyLocation,
      propertyType,
      description,
    });
    setSubmitting(false);
    setSubmitted(true);
  }

  const selectedFirm = firms.find((f) => f.id === firmId);

  return (
    <div className="sell-property">
      <header className="sell-property__intro">
        <span className="sell-property__eyebrow">
          <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
          Verified ownership, every time
        </span>
        <h1>Sell your property</h1>
        <p>
          Tell us about your property and the firm you choose will reach out to verify ownership
          and prepare a listing. We never list a property from an individual seller until title
          and ID documents are reviewed.
        </p>
      </header>

      {submitted ? (
        <div className="sell-property__confirmation">
          <CheckCircle2 size={32} strokeWidth={1.75} aria-hidden="true" />
          <h3>Your inquiry has been sent</h3>
          <p>
            {selectedFirm?.name ?? "The firm"} will contact you within 2 business days to discuss
            your property and the ownership verification documents they'll need. No live chat —
            just wait for their call or email.
          </p>
          <Link to="/" className="sell-property__confirmation-link">
            Back to listings
          </Link>
        </div>
      ) : (
        <form className="sell-property__form" onSubmit={handleSubmit}>
          <div className="sell-property__field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="sell-property__field-row">
            <div className="sell-property__field">
              <label htmlFor="contactNumber">Contact number</label>
              <input
                id="contactNumber"
                type="tel"
                required
                placeholder="09XX-XXX-XXXX"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
            </div>
            <div className="sell-property__field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="sell-property__field">
            <label htmlFor="propertyLocation">Property location</label>
            <input
              id="propertyLocation"
              type="text"
              required
              placeholder="Barangay, City/Municipality"
              value={propertyLocation}
              onChange={(e) => setPropertyLocation(e.target.value)}
            />
          </div>

          <div className="sell-property__field">
            <span className="sell-property__radio-label">Property type</span>
            <div className="sell-property__radio-group" role="radiogroup">
              {(["House and Lot", "Lot Only"] as SellerPropertyType[]).map((type) => (
                <label key={type} className="sell-property__radio-option">
                  <input
                    type="radio"
                    name="propertyType"
                    value={type}
                    checked={propertyType === type}
                    onChange={() => setPropertyType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div className="sell-property__field">
            <label htmlFor="description">Short description</label>
            <textarea
              id="description"
              rows={4}
              required
              placeholder="Size, condition, why you're selling, anything a buyer should know"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="sell-property__field">
            <label htmlFor="firm">Preferred firm</label>
            {loadingFirms ? (
              <Skeleton height={42} />
            ) : (
              <select id="firm" required value={firmId} onChange={(e) => setFirmId(e.target.value)}>
                {firms.map((firm) => (
                  <option key={firm.id} value={firm.id}>
                    {firm.name} — {firm.city}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button type="submit" className="sell-property__submit" disabled={submitting || loadingFirms}>
            {submitting ? "Sending…" : "Submit Inquiry"}
          </button>
        </form>
      )}
    </div>
  );
}
