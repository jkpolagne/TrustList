import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { PropertyImagePlaceholder } from "../PropertyImagePlaceholder";
import type { Property } from "../../types";
import "./PropertyGallery.css";

interface PropertyGalleryProps {
  property: Property;
}

/** Full listing photo gallery — a large image plus a thumbnail strip, unlike
 * PropertyPhoto (used on cards/popups) which only ever shows the cover photo. */
export function PropertyGallery({ property }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const photos = property.images;

  if (photos.length === 0) {
    return (
      <div className="property-gallery">
        <PropertyImagePlaceholder propertyType={property.propertyType} className="property-gallery__main" />
      </div>
    );
  }

  const activeSrc = photos[Math.min(activeIndex, photos.length - 1)];

  function showPrev() {
    setActiveIndex((i) => (i - 1 + photos.length) % photos.length);
  }

  function showNext() {
    setActiveIndex((i) => (i + 1) % photos.length);
  }

  return (
    <div className="property-gallery">
      <div className="property-gallery__main-wrap">
        <img src={activeSrc} alt={`${property.title} — photo ${activeIndex + 1} of ${photos.length}`} className="property-gallery__main" />
        {photos.length > 1 ? (
          <>
            <button type="button" className="property-gallery__nav property-gallery__nav--prev" onClick={showPrev} aria-label="Previous photo">
              <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
            </button>
            <button type="button" className="property-gallery__nav property-gallery__nav--next" onClick={showNext} aria-label="Next photo">
              <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
            </button>
            <span className="property-gallery__counter">
              {activeIndex + 1} / {photos.length}
            </span>
          </>
        ) : null}
      </div>

      {photos.length > 1 ? (
        <div className="property-gallery__thumbs" role="tablist" aria-label="Listing photos">
          {photos.map((src, index) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`View photo ${index + 1}`}
              className={`property-gallery__thumb${index === activeIndex ? " property-gallery__thumb--active" : ""}`}
              onClick={() => setActiveIndex(index)}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
