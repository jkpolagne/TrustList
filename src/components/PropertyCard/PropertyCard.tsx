import { Bath, BedDouble, MapPin, Ruler } from "lucide-react";
import { PropertyImagePlaceholder } from "../PropertyImagePlaceholder";
import { VerificationBadge } from "../VerificationBadge";
import type { Property } from "../../types";
import { formatPHP } from "../../utils/finance";
import "./PropertyCard.css";

interface PropertyCardProps {
  property: Property;
  firmName: string;
  active?: boolean;
  onSelect: (id: string) => void;
}

const STATUS_CLASS: Record<Property["status"], string> = {
  Available: "property-card__status--available",
  Reserved: "property-card__status--reserved",
  Sold: "property-card__status--sold",
};

export function PropertyCard({ property, firmName, active, onSelect }: PropertyCardProps) {
  const area = property.isLotOnly ? property.lotAreaSqm : property.floorAreaSqm;

  return (
    <button
      type="button"
      className={`property-card${active ? " property-card--active" : ""}`}
      onClick={() => onSelect(property.id)}
    >
      <div className="property-card__image">
        <PropertyImagePlaceholder propertyType={property.propertyType} />
        <span className={`property-card__status ${STATUS_CLASS[property.status]}`}>
          {property.status}
        </span>
      </div>

      <div className="property-card__body">
        <div className="property-card__top-row">
          <span className="property-card__type">{property.propertyType}</span>
          {property.listingSource === "Individual Seller" &&
          property.verificationStatus === "Verified" ? (
            <VerificationBadge type="ownership" status="verified" />
          ) : null}
        </div>

        <h4 className="property-card__title">{property.title}</h4>

        <div className="property-card__location">
          <MapPin size={13} strokeWidth={2} aria-hidden="true" />
          <span>{property.city}</span>
        </div>

        <div className="property-card__price money">{formatPHP(property.price)}</div>

        <div className="property-card__specs">
          {property.bedrooms ? (
            <span>
              <BedDouble size={14} strokeWidth={2} aria-hidden="true" />
              {property.bedrooms}
            </span>
          ) : null}
          {property.bathrooms ? (
            <span>
              <Bath size={14} strokeWidth={2} aria-hidden="true" />
              {property.bathrooms}
            </span>
          ) : null}
          {area ? (
            <span>
              <Ruler size={14} strokeWidth={2} aria-hidden="true" />
              {area} sqm
            </span>
          ) : null}
        </div>

        <div className="property-card__firm">{firmName}</div>
      </div>
    </button>
  );
}
