import { PropertyImagePlaceholder } from "../PropertyImagePlaceholder";
import type { Property } from "../../types";
import "./PropertyPhoto.css";

interface PropertyPhotoProps {
  property: Property;
  className?: string;
  compact?: boolean;
}

/** Renders the listing's real photo when one is set; falls back to the type
 * icon placeholder for listings without a photo yet (e.g. a freshly converted
 * seller inquiry, before the firm uploads real photos). */
export function PropertyPhoto({ property, className, compact }: PropertyPhotoProps) {
  const src = property.images[0];

  if (!src) {
    return (
      <PropertyImagePlaceholder propertyType={property.propertyType} className={className} compact={compact} />
    );
  }

  return (
    <img
      src={src}
      alt={property.title}
      loading="lazy"
      className={`property-photo${className ? ` ${className}` : ""}`}
    />
  );
}
