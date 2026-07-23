import { Landmark } from "lucide-react";
import type { LoanQuotation, Property } from "../../types";
import { formatPHP } from "../../utils/finance";
import { computeZonalValue } from "../../utils/valuation";
import "./PropertyValuationCard.css";

interface PropertyValuationCardProps {
  property: Property;
  /** Undefined when this property's barangay has no zonal data yet. */
  zonalValuePerSqm?: number;
  /** Undefined when no bank quotation has been drawn up for this listing. */
  loanQuotation?: LoanQuotation;
}

/** Never presents a figure as exact — every value here is explicitly labeled
 * with its data source (BIR zonal valuation or developer pricing) and closes
 * with an estimate disclaimer, per the trust-first theme of this product. */
export function PropertyValuationCard({
  property,
  zonalValuePerSqm,
  loanQuotation,
}: PropertyValuationCardProps) {
  const lotArea = property.lotAreaSqm;
  const zonalValue =
    zonalValuePerSqm !== undefined && lotArea ? computeZonalValue(zonalValuePerSqm, lotArea) : undefined;
  const isDeveloperSourced = property.listingSource === "Developer";
  const developerValue = isDeveloperSourced ? (loanQuotation?.listPrice ?? property.price) : undefined;

  let primaryLabel: string;
  let primaryValue: number | undefined;
  let primaryNote: string | undefined;
  let secondaryNote: string | undefined;

  if (property.isLotOnly) {
    primaryLabel = "Based on government zonal valuation";
    primaryValue = zonalValue;
    primaryNote =
      zonalValue !== undefined && zonalValuePerSqm !== undefined
        ? `₱${zonalValuePerSqm.toLocaleString("en-PH")}/sqm × ${lotArea} sqm`
        : undefined;
  } else if (isDeveloperSourced) {
    primaryLabel = "Based on developer pricing";
    primaryValue = developerValue;
    primaryNote = loanQuotation
      ? `Developer pricelist via ${loanQuotation.bankName} quotation`
      : "Developer's listed price";
    if (zonalValue !== undefined && zonalValuePerSqm !== undefined) {
      secondaryNote = `Zonal value reference: ₱${zonalValuePerSqm.toLocaleString("en-PH")}/sqm × ${lotArea} sqm land component = ${formatPHP(zonalValue)}`;
    }
  } else {
    primaryLabel = "Based on government zonal valuation (land only)";
    primaryValue = zonalValue;
    primaryNote =
      zonalValue !== undefined && zonalValuePerSqm !== undefined
        ? `₱${zonalValuePerSqm.toLocaleString("en-PH")}/sqm × ${lotArea} sqm — excludes the value of the structure`
        : undefined;
  }

  if (primaryValue === undefined) {
    return (
      <div className="valuation-card valuation-card--empty">
        <Landmark size={16} strokeWidth={2} aria-hidden="true" />
        <span>Valuation data isn't available yet for this location.</span>
      </div>
    );
  }

  return (
    <div className="valuation-card">
      <div className="valuation-card__header">
        <Landmark size={16} strokeWidth={2} aria-hidden="true" />
        <span>Estimated Market Value</span>
      </div>
      <div className="valuation-card__amount money">{formatPHP(primaryValue)}</div>
      <div className="valuation-card__label">{primaryLabel}</div>
      {primaryNote ? <div className="valuation-card__note">{primaryNote}</div> : null}
      {secondaryNote ? <div className="valuation-card__secondary">{secondaryNote}</div> : null}
      <p className="valuation-card__disclaimer">
        Estimate only, not an appraisal — actual market value may differ.
      </p>
    </div>
  );
}
