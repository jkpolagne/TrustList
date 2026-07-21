import { Scale, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { PropertyImagePlaceholder } from "../components/PropertyImagePlaceholder";
import { Skeleton } from "../components/Skeleton";
import { VerificationBadge } from "../components/VerificationBadge";
import { useCompare } from "../context/CompareContext";
import { getDevelopers, getFirms, getPropertiesByIds } from "../services";
import type { Developer, Firm, Property } from "../types";
import { formatPHP } from "../utils/finance";
import "./Compare.css";

export function Compare() {
  const navigate = useNavigate();
  const { compareIds, removeFromCompare, clearCompare } = useCompare();

  const [properties, setProperties] = useState<Property[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (compareIds.length === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getPropertiesByIds(compareIds), getFirms(), getDevelopers()]).then(
      ([propertiesData, firmsData, developersData]) => {
        // preserve selection order
        const ordered = compareIds
          .map((id) => propertiesData.find((p) => p.id === id))
          .filter((p): p is Property => Boolean(p));
        setProperties(ordered);
        setFirms(firmsData);
        setDevelopers(developersData);
        setLoading(false);
      },
    );
  }, [compareIds]);

  const firmsById = useMemo(() => new Map(firms.map((f) => [f.id, f])), [firms]);
  const developersById = useMemo(() => new Map(developers.map((d) => [d.id, d])), [developers]);

  if (loading) {
    return (
      <div className="compare-page">
        <h1>Compare Properties</h1>
        <div className="compare-page__loading">
          <Skeleton height={420} />
          <Skeleton height={420} />
        </div>
      </div>
    );
  }

  if (compareIds.length === 0) {
    return (
      <div className="compare-page">
        <h1>Compare Properties</h1>
        <EmptyState
          icon={Scale}
          title="No properties selected"
          description="Add up to 2 properties to compare from the browse page."
          action={
            <Link to="/" className="compare-page__browse-link">
              Browse listings
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="compare-page">
      <div className="compare-page__header">
        <h1>Compare Properties</h1>
        <button type="button" className="compare-page__clear" onClick={clearCompare}>
          Clear comparison
        </button>
      </div>

      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="compare-table__label-col" />
              {properties.map((property) => (
                <th key={property.id}>
                  <div className="compare-table__col-header">
                    <button
                      type="button"
                      className="compare-table__remove"
                      onClick={() => removeFromCompare(property.id)}
                      aria-label={`Remove ${property.title} from comparison`}
                    >
                      <X size={13} strokeWidth={2} aria-hidden="true" />
                    </button>
                    <div className="compare-table__image">
                      <PropertyImagePlaceholder propertyType={property.propertyType} />
                    </div>
                    <span className="compare-table__title">{property.title}</span>
                  </div>
                </th>
              ))}
              {properties.length < 2 ? (
                <th>
                  <Link to="/" className="compare-table__add-more">
                    + Add another property
                  </Link>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="compare-table__label-col">Price</th>
              {properties.map((p) => (
                <td key={p.id} className="money compare-table__price">
                  {formatPHP(p.price)}
                </td>
              ))}
            </tr>
            <tr>
              <th className="compare-table__label-col">Type</th>
              {properties.map((p) => (
                <td key={p.id}>{p.propertyType}</td>
              ))}
            </tr>
            <tr>
              <th className="compare-table__label-col">Lot area</th>
              {properties.map((p) => (
                <td key={p.id}>{p.lotAreaSqm ? `${p.lotAreaSqm} sqm` : "—"}</td>
              ))}
            </tr>
            <tr>
              <th className="compare-table__label-col">Floor area</th>
              {properties.map((p) => (
                <td key={p.id}>{p.floorAreaSqm ? `${p.floorAreaSqm} sqm` : "—"}</td>
              ))}
            </tr>
            <tr>
              <th className="compare-table__label-col">Bedrooms</th>
              {properties.map((p) => (
                <td key={p.id}>{p.bedrooms ?? "—"}</td>
              ))}
            </tr>
            <tr>
              <th className="compare-table__label-col">Bathrooms</th>
              {properties.map((p) => (
                <td key={p.id}>{p.bathrooms ?? "—"}</td>
              ))}
            </tr>
            <tr>
              <th className="compare-table__label-col">Turnover</th>
              {properties.map((p) => (
                <td key={p.id}>{p.turnover}</td>
              ))}
            </tr>
            <tr>
              <th className="compare-table__label-col">Location</th>
              {properties.map((p) => (
                <td key={p.id}>{p.city}</td>
              ))}
            </tr>
            <tr>
              <th className="compare-table__label-col">Developer / Source</th>
              {properties.map((p) => (
                <td key={p.id}>
                  {p.listingSource === "Developer"
                    ? (p.developerId ? developersById.get(p.developerId)?.name : undefined) ??
                      "Developer"
                    : "Individual Seller"}
                </td>
              ))}
            </tr>
            <tr>
              <th className="compare-table__label-col">Firm</th>
              {properties.map((p) => (
                <td key={p.id}>{firmsById.get(p.companyId)?.name ?? "—"}</td>
              ))}
            </tr>
            <tr>
              <th className="compare-table__label-col">Status</th>
              {properties.map((p) => (
                <td key={p.id}>{p.status}</td>
              ))}
            </tr>
            <tr>
              <th className="compare-table__label-col">Ownership</th>
              {properties.map((p) => (
                <td key={p.id}>
                  {p.listingSource === "Individual Seller" && p.verificationStatus === "Verified" ? (
                    <VerificationBadge type="ownership" status="verified" />
                  ) : (
                    "—"
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <th className="compare-table__label-col">Features</th>
              {properties.map((p) => (
                <td key={p.id}>
                  <ul className="compare-table__features">
                    {p.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
            <tr>
              <th className="compare-table__label-col" />
              {properties.map((p) => (
                <td key={p.id}>
                  <button
                    type="button"
                    className="compare-table__view-btn"
                    onClick={() => navigate(`/properties/${p.id}`)}
                  >
                    View Full Details
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
