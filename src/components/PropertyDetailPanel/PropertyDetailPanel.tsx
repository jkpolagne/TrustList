import { BedDouble, Building2, Check, Layers, Plus, Ruler, X } from "lucide-react";
import { Link } from "react-router-dom";
import { PropertyImagePlaceholder } from "../PropertyImagePlaceholder";
import { VerificationBadge } from "../VerificationBadge";
import type { Property } from "../../types";
import { formatPHP } from "../../utils/finance";
import "./PropertyDetailPanel.css";

interface PropertyDetailPanelProps {
  property: Property;
  firmName: string;
  developerName?: string;
  isComparing: boolean;
  compareDisabled: boolean;
  onToggleCompare: (id: string) => void;
  onClose: () => void;
}

export function PropertyDetailPanel({
  property,
  firmName,
  developerName,
  isComparing,
  compareDisabled,
  onToggleCompare,
  onClose,
}: PropertyDetailPanelProps) {
  const area = property.isLotOnly ? property.lotAreaSqm : property.floorAreaSqm;
  const sourceLabel =
    property.listingSource === "Developer" ? developerName ?? "Developer" : "Individual Seller";

  return (
    <aside className="detail-panel" aria-label="Property quick view">
      <button
        type="button"
        className="detail-panel__close"
        onClick={onClose}
        aria-label="Close property panel"
      >
        <X size={18} strokeWidth={2} />
      </button>

      <div className="detail-panel__image">
        <PropertyImagePlaceholder propertyType={property.propertyType} />
      </div>

      <div className="detail-panel__body">
        <span className="detail-panel__type">{property.propertyType}</span>
        <h3 className="detail-panel__title">{property.title}</h3>

        {property.listingSource === "Individual Seller" &&
        property.verificationStatus === "Verified" ? (
          <VerificationBadge type="ownership" status="verified" />
        ) : null}

        <div className="detail-panel__price money">{formatPHP(property.price)}</div>

        <dl className="detail-panel__facts">
          <div>
            <dt>
              <Building2 size={14} strokeWidth={2} aria-hidden="true" /> Source
            </dt>
            <dd>{sourceLabel}</dd>
          </div>
          <div>
            <dt>Firm</dt>
            <dd>{firmName}</dd>
          </div>
          {property.bedrooms ? (
            <div>
              <dt>
                <BedDouble size={14} strokeWidth={2} aria-hidden="true" /> Bedrooms
              </dt>
              <dd>{property.bedrooms}</dd>
            </div>
          ) : null}
          {area ? (
            <div>
              <dt>
                <Ruler size={14} strokeWidth={2} aria-hidden="true" />{" "}
                {property.isLotOnly ? "Lot area" : "Floor area"}
              </dt>
              <dd>{area} sqm</dd>
            </div>
          ) : null}
          <div>
            <dt>
              <Layers size={14} strokeWidth={2} aria-hidden="true" /> Status
            </dt>
            <dd>{property.status}</dd>
          </div>
        </dl>

        <div className="detail-panel__actions">
          <button
            type="button"
            className={`detail-panel__compare-btn${isComparing ? " detail-panel__compare-btn--active" : ""}`}
            onClick={() => onToggleCompare(property.id)}
            disabled={!isComparing && compareDisabled}
          >
            {isComparing ? (
              <>
                <Check size={15} strokeWidth={2} aria-hidden="true" /> Added to Compare
              </>
            ) : (
              <>
                <Plus size={15} strokeWidth={2} aria-hidden="true" /> Add to Compare
              </>
            )}
          </button>
          <Link to={`/properties/${property.id}`} className="detail-panel__view-btn">
            View Full Details
          </Link>
        </div>
      </div>
    </aside>
  );
}
