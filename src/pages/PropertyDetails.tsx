import {
  Bath,
  BedDouble,
  Building2,
  Calendar,
  ChevronLeft,
  Layers,
  MapPin,
  Ruler,
  SearchX,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConsultantCard } from "../components/ConsultantCard";
import { EmptyState } from "../components/EmptyState";
import { PropertyCard } from "../components/PropertyCard";
import { PropertyMap } from "../components/PropertyMap";
import { PropertyPhoto } from "../components/PropertyPhoto";
import { PropertyValuationCard } from "../components/PropertyValuationCard";
import { Skeleton } from "../components/Skeleton";
import { VerificationBadge } from "../components/VerificationBadge";
import { useReferral } from "../context/ReferralContext";
import {
  getDeveloperById,
  getFirmById,
  getLoanQuotationByProperty,
  getPublicPropertyById,
  getPublicProperties,
  getZonalValuePerSqm,
} from "../services";
import type { Developer, Firm, LoanQuotation, Property } from "../types";
import { formatPHP } from "../utils/finance";
import "./PropertyDetails.css";

export function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { consultant } = useReferral();

  const [property, setProperty] = useState<Property | null | undefined>(undefined);
  const [firm, setFirm] = useState<Firm | undefined>();
  const [developer, setDeveloper] = useState<Developer | undefined>();
  const [similar, setSimilar] = useState<Property[]>([]);
  const [zonalValuePerSqm, setZonalValuePerSqm] = useState<number>();
  const [loanQuotation, setLoanQuotation] = useState<LoanQuotation>();

  useEffect(() => {
    if (!id) return;
    setProperty(undefined);
    setZonalValuePerSqm(undefined);
    setLoanQuotation(undefined);

    getPublicPropertyById(id).then((found) => {
      setProperty(found ?? null);
      if (!found) return;

      getFirmById(found.companyId).then(setFirm);
      if (found.developerId) getDeveloperById(found.developerId).then(setDeveloper);
      getZonalValuePerSqm(found.city, found.barangay).then(setZonalValuePerSqm);
      getLoanQuotationByProperty(found.id).then(setLoanQuotation);

      getPublicProperties().then((all) => {
        const candidates = all
          .filter((p) => p.id !== found.id && p.propertyType === found.propertyType)
          .sort((a, b) => Math.abs(a.price - found.price) - Math.abs(b.price - found.price));
        setSimilar(candidates.slice(0, 3));
      });
    });
  }, [id]);

  const showConsultantCard = useMemo(
    () => Boolean(consultant && property && consultant.companyId === property.companyId),
    [consultant, property],
  );

  if (property === undefined) {
    return (
      <div className="property-details">
        <Skeleton height={320} style={{ marginBottom: 20 }} />
        <div className="property-details__layout">
          <div className="property-details__main">
            <Skeleton height={32} width="60%" style={{ marginBottom: 12 }} />
            <Skeleton height={20} width="30%" style={{ marginBottom: 20 }} />
            <Skeleton height={120} />
          </div>
          <Skeleton height={260} />
        </div>
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
          <Link to="/" className="property-details__back-link">
            <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
            Back to listings
          </Link>
        }
      />
    );
  }

  const area = property.isLotOnly ? property.lotAreaSqm : property.floorAreaSqm;

  return (
    <div className="property-details">
      <Link to="/" className="property-details__back-link">
        <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
        Back to listings
      </Link>

      <div className="property-details__gallery">
        <div className="property-details__hero">
          <PropertyPhoto property={property} />
        </div>
      </div>

      <div className="property-details__layout">
        <div className="property-details__main">
          <div className="property-details__badges">
            <span className="property-details__type">{property.propertyType}</span>
            {property.listingSource === "Individual Seller" &&
            property.verificationStatus === "Verified" ? (
              <VerificationBadge type="ownership" status="verified" />
            ) : null}
          </div>

          <h1>{property.title}</h1>
          <div className="property-details__address">
            <MapPin size={14} strokeWidth={2} aria-hidden="true" />
            {property.address}
          </div>

          <div className="property-details__price money">{formatPHP(property.price)}</div>

          <section className="property-details__section">
            <h3>Overview</h3>
            <p>{property.description}</p>
          </section>

          <section className="property-details__section">
            <h3>Property Details</h3>
            <dl className="property-details__facts">
              <div>
                <dt>
                  <Building2 size={14} strokeWidth={2} aria-hidden="true" /> Listed by
                </dt>
                <dd>
                  {property.listingSource === "Developer"
                    ? (developer?.name ?? "Developer")
                    : "Individual Seller"}
                </dd>
              </div>
              <div>
                <dt>Firm</dt>
                <dd>{firm?.name ?? "—"}</dd>
              </div>
              {property.bedrooms ? (
                <div>
                  <dt>
                    <BedDouble size={14} strokeWidth={2} aria-hidden="true" /> Bedrooms
                  </dt>
                  <dd>{property.bedrooms}</dd>
                </div>
              ) : null}
              {property.bathrooms ? (
                <div>
                  <dt>
                    <Bath size={14} strokeWidth={2} aria-hidden="true" /> Bathrooms
                  </dt>
                  <dd>{property.bathrooms}</dd>
                </div>
              ) : null}
              {property.lotAreaSqm ? (
                <div>
                  <dt>
                    <Ruler size={14} strokeWidth={2} aria-hidden="true" /> Lot area
                  </dt>
                  <dd>{property.lotAreaSqm} sqm</dd>
                </div>
              ) : null}
              {property.floorAreaSqm ? (
                <div>
                  <dt>
                    <Ruler size={14} strokeWidth={2} aria-hidden="true" /> Floor area
                  </dt>
                  <dd>{property.floorAreaSqm} sqm</dd>
                </div>
              ) : null}
              <div>
                <dt>
                  <Calendar size={14} strokeWidth={2} aria-hidden="true" /> Turnover
                </dt>
                <dd>{property.turnover}</dd>
              </div>
              <div>
                <dt>
                  <Layers size={14} strokeWidth={2} aria-hidden="true" /> Status
                </dt>
                <dd>{property.status}</dd>
              </div>
            </dl>
          </section>

          <section className="property-details__section">
            <h3>Estimated Market Value</h3>
            <PropertyValuationCard
              property={property}
              zonalValuePerSqm={zonalValuePerSqm}
              loanQuotation={loanQuotation}
            />
          </section>

          {property.features.length > 0 ? (
            <section className="property-details__section">
              <h3>Features</h3>
              <div className="property-details__features">
                {property.features.map((feature) => (
                  <span key={feature}>{feature}</span>
                ))}
              </div>
            </section>
          ) : null}

          <section className="property-details__section">
            <h3>Location</h3>
            <div className="property-details__map">
              <PropertyMap properties={[property]} onMarkerClick={() => {}} />
            </div>
          </section>

          {showConsultantCard && consultant ? (
            <section className="property-details__section">
              <h3>Your Referring Consultant</h3>
              <ConsultantCard consultant={consultant} />
            </section>
          ) : null}

          {similar.length > 0 ? (
            <section className="property-details__section">
              <h3>Similar Properties</h3>
              <div className="property-details__similar-grid">
                {similar.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    firmName={firm && p.companyId === firm.id ? firm.name : ""}
                    onSelect={(propId) => navigate(`/properties/${propId}`)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="property-details__sidebar">
          <div className="property-details__sidebar-card">
            <div className="property-details__sidebar-price money">
              {formatPHP(property.price)}
            </div>
            <dl className="property-details__sidebar-facts">
              <div>
                <dt>Status</dt>
                <dd>{property.status}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{property.propertyType}</dd>
              </div>
              {property.bedrooms ? (
                <div>
                  <dt>Bedrooms</dt>
                  <dd>{property.bedrooms}</dd>
                </div>
              ) : null}
              {area ? (
                <div>
                  <dt>{property.isLotOnly ? "Lot area" : "Floor area"}</dt>
                  <dd>{area} sqm</dd>
                </div>
              ) : null}
            </dl>
            <Link to={`/properties/${property.id}/visit`} className="property-details__visit-btn">
              Schedule Visit
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
