import { Calculator, Landmark } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { getLocations } from "../services";
import type { LocationZonalValue, PropertyType } from "../types";
import { formatPHP } from "../utils/finance";
import { computeZonalValue } from "../utils/valuation";
import "./PropertyValuation.css";

const PROPERTY_TYPES: PropertyType[] = ["Lot Only", "House", "Townhouse", "Condominium"];

function locationKey(l: LocationZonalValue): string {
  return `${l.city}__${l.barangay}`;
}

export function PropertyValuation() {
  const [locations, setLocations] = useState<LocationZonalValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationKeyValue, setLocationKeyValue] = useState("");
  const [lotArea, setLotArea] = useState("150");
  const [propertyType, setPropertyType] = useState<PropertyType>("Lot Only");

  useEffect(() => {
    getLocations().then((data) => {
      setLocations(data);
      if (data[0]) setLocationKeyValue(locationKey(data[0]));
      setLoading(false);
    });
  }, []);

  const selectedLocation = useMemo(
    () => locations.find((l) => locationKey(l) === locationKeyValue),
    [locations, locationKeyValue],
  );

  const numericArea = Number(lotArea) || 0;
  const zonalValue = selectedLocation && numericArea > 0 ? computeZonalValue(selectedLocation.zonalValuePerSqm, numericArea) : undefined;
  const isLotOnly = propertyType === "Lot Only";

  return (
    <div className="property-valuation-page">
      <header className="property-valuation-page__header">
        <h1>Property Valuation</h1>
        <p>
          Estimate a property's market value from the barangay-level BIR zonal valuation — the
          same reference used on every listing's Estimated Market Value card.
        </p>
      </header>

      {loading ? (
        <Skeleton height={320} />
      ) : locations.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No zonal valuation data yet"
          description="Barangay-level zonal values will show up here once they're added."
        />
      ) : (
        <div className="property-valuation-page__panel">
          <div className="property-valuation-page__form">
            <div className="property-valuation-page__field">
              <label htmlFor="valLocation">Location</label>
              <select
                id="valLocation"
                value={locationKeyValue}
                onChange={(e) => setLocationKeyValue(e.target.value)}
              >
                {locations.map((l) => (
                  <option key={locationKey(l)} value={locationKey(l)}>
                    {l.city} — Brgy. {l.barangay}
                  </option>
                ))}
              </select>
            </div>

            <div className="property-valuation-page__field">
              <label htmlFor="valLotArea">Lot area (sqm)</label>
              <input
                id="valLotArea"
                type="number"
                min={0}
                step={10}
                value={lotArea}
                onChange={(e) => setLotArea(e.target.value)}
              />
            </div>

            <div className="property-valuation-page__field">
              <label htmlFor="valPropertyType">Property type</label>
              <select
                id="valPropertyType"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="property-valuation-page__result">
            <div className="property-valuation-page__result-header">
              <Calculator size={16} strokeWidth={2} aria-hidden="true" />
              <span>Estimated Value</span>
            </div>

            {zonalValue !== undefined && selectedLocation ? (
              <>
                <div className="property-valuation-page__amount money">{formatPHP(zonalValue)}</div>
                <p className="property-valuation-page__label">
                  {isLotOnly
                    ? "Based on government zonal valuation"
                    : "Based on government zonal valuation (land value only)"}
                </p>
                <div className="property-valuation-page__breakdown">
                  ₱{selectedLocation.zonalValuePerSqm.toLocaleString("en-PH")}/sqm ×{" "}
                  {numericArea.toLocaleString("en-PH")} sqm = {formatPHP(zonalValue)}
                </div>
                {!isLotOnly ? (
                  <p className="property-valuation-page__note">
                    This figure covers the land component only — it doesn't include the value of
                    any house, unit, or other structure. Check a specific listing's developer
                    pricing for a full house-and-lot estimate.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="property-valuation-page__note">Enter a lot area to see an estimate.</p>
            )}

            <p className="property-valuation-page__disclaimer">
              Estimate only, based on the barangay's government zonal valuation for tax purposes —
              not an appraisal. Actual market value may differ.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
