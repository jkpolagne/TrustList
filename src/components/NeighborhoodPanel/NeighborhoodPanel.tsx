import { Church, Hospital, Info, Route, School, Store } from "lucide-react";
import { HazardInfoCard } from "../HazardInfoCard";
import type { HazardInfo, NearbyEstablishment, NearbyEstablishmentType } from "../../types";
import { formatPHP } from "../../utils/finance";
import "./NeighborhoodPanel.css";

const ICON_BY_TYPE: Record<NearbyEstablishmentType, typeof Store> = {
  market: Store,
  hospital: Hospital,
  school: School,
  church: Church,
  highway: Route,
};

interface NeighborhoodPanelProps {
  establishments: NearbyEstablishment[];
  /** Undefined when this barangay has no zonal valuation data on file yet. */
  zonalValuePerSqm?: number;
  hazardInfo: HazardInfo;
}

/** Groups everything a buyer needs to judge "the area" in one place — nearby
 * essentials, what land here typically costs, and the hazard profile — instead
 * of scattering location-context content across separate sections. */
export function NeighborhoodPanel({ establishments, zonalValuePerSqm, hazardInfo }: NeighborhoodPanelProps) {
  return (
    <div className="neighborhood-panel">
      {establishments.length > 0 ? (
        <div className="neighborhood-panel__section">
          <h4>What's Nearby</h4>
          <div className="neighborhood-panel__chips">
            {establishments.map((establishment) => {
              const Icon = ICON_BY_TYPE[establishment.type];
              return (
                <span key={`${establishment.type}-${establishment.name}`} className="neighborhood-panel__chip">
                  <Icon size={14} strokeWidth={2} aria-hidden="true" />
                  <span className="neighborhood-panel__chip-name">{establishment.name}</span>
                  <span className="neighborhood-panel__chip-distance">{establishment.distanceKm} km</span>
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="neighborhood-panel__section">
        <h4>Barangay Price Context</h4>
        <p className="neighborhood-panel__price-line">
          <Info size={13} strokeWidth={2} aria-hidden="true" />
          {zonalValuePerSqm !== undefined ? (
            <span>
              Properties in this area are typically priced at{" "}
              <strong>{formatPHP(zonalValuePerSqm)}/sqm</strong> based on government zonal valuation.
            </span>
          ) : (
            <span>Zonal valuation data isn't available yet for this barangay.</span>
          )}
        </p>
        <p className="neighborhood-panel__price-note">For reference only — actual prices vary.</p>
      </div>

      <div className="neighborhood-panel__section">
        <h4>Location Hazard Info</h4>
        <HazardInfoCard hazardInfo={hazardInfo} />
      </div>
    </div>
  );
}
