import { Building, Building2, Home, LandPlot } from "lucide-react";
import type { PropertyType } from "../../types";
import "./PropertyImagePlaceholder.css";

const ICON_BY_TYPE: Record<PropertyType, typeof Home> = {
  "Lot Only": LandPlot,
  House: Home,
  Townhouse: Building,
  Condominium: Building2,
};

interface PropertyImagePlaceholderProps {
  propertyType: PropertyType;
  className?: string;
  compact?: boolean;
}

export function PropertyImagePlaceholder({
  propertyType,
  className,
  compact,
}: PropertyImagePlaceholderProps) {
  const Icon = ICON_BY_TYPE[propertyType];

  return (
    <div
      className={`property-image-placeholder${compact ? " property-image-placeholder--compact" : ""} ${className ?? ""}`}
    >
      <Icon size={compact ? 22 : 34} strokeWidth={1.5} aria-hidden="true" />
      {!compact ? <span>{propertyType}</span> : null}
    </div>
  );
}
