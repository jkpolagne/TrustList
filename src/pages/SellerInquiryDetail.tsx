import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  FileCheck2,
  Mail,
  MapPin,
  Phone,
  SearchX,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import {
  convertInquiryToListing,
  getPropertyById,
  getSellerInquiryById,
  mockVerificationDocuments,
  updateSellerInquiryStatus,
} from "../services";
import type { ListingDraft, Property, PropertyType, SellerInquiry } from "../types";
import "./SellerInquiryDetail.css";

const CITY_OPTIONS = ["Naga City", "Pili", "Legazpi City"];

function guessCity(location: string): string {
  return CITY_OPTIONS.find((city) => location.includes(city.split(" ")[0])) ?? CITY_OPTIONS[0];
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SellerInquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();

  const [inquiry, setInquiry] = useState<SellerInquiry | null | undefined>(undefined);
  const [linkedProperty, setLinkedProperty] = useState<Property | undefined>();
  const [updating, setUpdating] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);

  const [draft, setDraft] = useState<ListingDraft | null>(null);

  useEffect(() => {
    if (!id) return;
    getSellerInquiryById(id).then((found) => {
      if (!found || found.firmId !== session?.firmId) {
        setInquiry(null);
        return;
      }
      setInquiry(found);
      if (found.propertyId) getPropertyById(found.propertyId).then(setLinkedProperty);
    });
  }, [id, session?.firmId]);

  function openConvertForm() {
    if (!inquiry) return;
    const city = guessCity(inquiry.propertyLocation);
    setDraft({
      title: inquiry.propertyLocation,
      city,
      address: inquiry.propertyLocation,
      price: 1000000,
      propertyType: inquiry.propertyType === "Lot Only" ? "Lot Only" : "House",
      bedrooms: inquiry.propertyType === "Lot Only" ? undefined : 3,
      bathrooms: inquiry.propertyType === "Lot Only" ? undefined : 2,
      lotAreaSqm: 150,
      floorAreaSqm: inquiry.propertyType === "Lot Only" ? undefined : 90,
      description: inquiry.description,
    });
    setShowConvertForm(true);
  }

  async function handleMarkContacted() {
    if (!inquiry) return;
    setUpdating(true);
    const updated = await updateSellerInquiryStatus(inquiry.id, "Contacted");
    if (updated) setInquiry(updated);
    setUpdating(false);
  }

  async function handleDecline() {
    if (!inquiry) return;
    setUpdating(true);
    const updated = await updateSellerInquiryStatus(inquiry.id, "Declined");
    if (updated) setInquiry(updated);
    setUpdating(false);
  }

  async function handleConvertSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inquiry || !draft) return;
    setConverting(true);
    const updated = await convertInquiryToListing(inquiry.id, draft);
    setConverting(false);
    if (updated) {
      setInquiry(updated);
      setShowConvertForm(false);
      if (updated.propertyId) getPropertyById(updated.propertyId).then(setLinkedProperty);
    }
  }

  if (inquiry === undefined) {
    return (
      <div className="inquiry-detail">
        <Skeleton height={28} width="30%" style={{ marginBottom: 20 }} />
        <Skeleton height={320} />
      </div>
    );
  }

  if (inquiry === null) {
    return (
      <EmptyState
        icon={SearchX}
        title="Inquiry not found"
        description="This inquiry may not exist, or it belongs to a different firm."
        action={
          <Link to="/app/seller-inquiries" className="inquiry-detail__back">
            <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
            Back to inquiries
          </Link>
        }
      />
    );
  }

  return (
    <div className="inquiry-detail">
      <Link to="/app/seller-inquiries" className="inquiry-detail__back">
        <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
        Back to inquiries
      </Link>

      <div className="inquiry-detail__header">
        <div>
          <h1>{inquiry.name}</h1>
          <p className="inquiry-detail__submitted">
            Submitted {formatDateTime(inquiry.submittedAt)}
          </p>
        </div>
        <span
          className={`inquiry-status inquiry-status--${inquiry.status === "Converted to Listing" ? "converted" : inquiry.status.toLowerCase()}`}
        >
          {inquiry.status}
        </span>
      </div>

      <div className="inquiry-detail__grid">
        <dl className="inquiry-detail__facts">
          <div>
            <dt>
              <Phone size={14} strokeWidth={2} aria-hidden="true" /> Contact number
            </dt>
            <dd>{inquiry.contactNumber}</dd>
          </div>
          <div>
            <dt>
              <Mail size={14} strokeWidth={2} aria-hidden="true" /> Email
            </dt>
            <dd>{inquiry.email}</dd>
          </div>
          <div>
            <dt>
              <MapPin size={14} strokeWidth={2} aria-hidden="true" /> Property location
            </dt>
            <dd>{inquiry.propertyLocation}</dd>
          </div>
          <div>
            <dt>
              <Building2 size={14} strokeWidth={2} aria-hidden="true" /> Property type
            </dt>
            <dd>{inquiry.propertyType}</dd>
          </div>
        </dl>

        <section className="inquiry-detail__description">
          <h3>Description</h3>
          <p>{inquiry.description}</p>
        </section>
      </div>

      <section className="inquiry-detail__actions-section">
        {inquiry.status === "New" || inquiry.status === "Contacted" ? (
          <div className="inquiry-detail__actions">
            {inquiry.status === "New" ? (
              <button type="button" onClick={handleMarkContacted} disabled={updating}>
                Mark as Contacted
              </button>
            ) : null}
            <button
              type="button"
              className="inquiry-detail__action--primary"
              onClick={openConvertForm}
              disabled={updating || showConvertForm}
            >
              Convert to Listing
            </button>
            <button
              type="button"
              className="inquiry-detail__action--danger"
              onClick={handleDecline}
              disabled={updating}
            >
              Decline
            </button>
          </div>
        ) : inquiry.status === "Converted to Listing" ? (
          <div className="inquiry-detail__converted-note">
            <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
            {linkedProperty ? (
              <span>
                Converted to listing <strong>{linkedProperty.title}</strong> — currently{" "}
                <strong>{linkedProperty.verificationStatus}</strong>.{" "}
                {linkedProperty.verificationStatus === "Pending Review" ? (
                  <Link to="/app/listing-verification">Review in Listing Verification →</Link>
                ) : linkedProperty.verificationStatus === "Verified" ? (
                  <Link to={`/properties/${linkedProperty.id}`}>View public listing →</Link>
                ) : null}
              </span>
            ) : (
              <span>Converted to a listing.</span>
            )}
          </div>
        ) : (
          <div className="inquiry-detail__declined-note">
            <ShieldAlert size={18} strokeWidth={2} aria-hidden="true" />
            This inquiry was declined.
          </div>
        )}
      </section>

      {showConvertForm && draft ? (
        <form className="inquiry-convert-form" onSubmit={handleConvertSubmit}>
          <h3>Create Listing</h3>
          <p className="inquiry-convert-form__hint">
            This creates a Property record with listing source "Individual Seller" and status
            "Pending Review" — it won't appear publicly until your firm approves it in Listing
            Verification.
          </p>

          <div className="inquiry-convert-form__field">
            <label htmlFor="draftTitle">Listing title</label>
            <input
              id="draftTitle"
              type="text"
              required
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>

          <div className="inquiry-convert-form__row">
            <div className="inquiry-convert-form__field">
              <label htmlFor="draftCity">City</label>
              <select
                id="draftCity"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              >
                {CITY_OPTIONS.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="inquiry-convert-form__field">
              <label htmlFor="draftPrice">Price (₱)</label>
              <input
                id="draftPrice"
                type="number"
                min={0}
                step={10000}
                required
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="inquiry-convert-form__field">
            <label htmlFor="draftAddress">Full address</label>
            <input
              id="draftAddress"
              type="text"
              required
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            />
          </div>

          {inquiry.propertyType === "House and Lot" ? (
            <div className="inquiry-convert-form__field">
              <label htmlFor="draftType">Property type</label>
              <select
                id="draftType"
                value={draft.propertyType}
                onChange={(e) =>
                  setDraft({ ...draft, propertyType: e.target.value as PropertyType })
                }
              >
                {(["House", "Townhouse", "Condominium"] as PropertyType[]).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {draft.propertyType !== "Lot Only" ? (
            <div className="inquiry-convert-form__row">
              <div className="inquiry-convert-form__field">
                <label htmlFor="draftBedrooms">Bedrooms</label>
                <input
                  id="draftBedrooms"
                  type="number"
                  min={0}
                  value={draft.bedrooms ?? ""}
                  onChange={(e) => setDraft({ ...draft, bedrooms: Number(e.target.value) })}
                />
              </div>
              <div className="inquiry-convert-form__field">
                <label htmlFor="draftBathrooms">Bathrooms</label>
                <input
                  id="draftBathrooms"
                  type="number"
                  min={0}
                  value={draft.bathrooms ?? ""}
                  onChange={(e) => setDraft({ ...draft, bathrooms: Number(e.target.value) })}
                />
              </div>
              <div className="inquiry-convert-form__field">
                <label htmlFor="draftFloorArea">Floor area (sqm)</label>
                <input
                  id="draftFloorArea"
                  type="number"
                  min={0}
                  value={draft.floorAreaSqm ?? ""}
                  onChange={(e) => setDraft({ ...draft, floorAreaSqm: Number(e.target.value) })}
                />
              </div>
            </div>
          ) : null}

          <div className="inquiry-convert-form__field">
            <label htmlFor="draftLotArea">Lot area (sqm)</label>
            <input
              id="draftLotArea"
              type="number"
              min={0}
              value={draft.lotAreaSqm ?? ""}
              onChange={(e) => setDraft({ ...draft, lotAreaSqm: Number(e.target.value) })}
            />
          </div>

          <div className="inquiry-convert-form__field">
            <label htmlFor="draftDescription">Description</label>
            <textarea
              id="draftDescription"
              rows={3}
              required
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>

          <div className="inquiry-convert-form__docs">
            <span className="inquiry-convert-form__docs-label">
              Verification documents submitted by seller
            </span>
            {mockVerificationDocuments(inquiry.name).map((doc) => (
              <div key={doc} className="inquiry-convert-form__doc">
                <FileCheck2 size={14} strokeWidth={2} aria-hidden="true" />
                {doc}
              </div>
            ))}
          </div>

          <div className="inquiry-convert-form__buttons">
            <button
              type="button"
              className="inquiry-convert-form__cancel"
              onClick={() => setShowConvertForm(false)}
              disabled={converting}
            >
              Cancel
            </button>
            <button type="submit" className="inquiry-convert-form__submit" disabled={converting}>
              {converting ? "Creating…" : "Create Listing (Pending Review)"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
