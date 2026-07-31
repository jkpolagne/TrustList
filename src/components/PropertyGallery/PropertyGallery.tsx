import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { PropertyImagePlaceholder } from "../PropertyImagePlaceholder";
import type { PhotoRoomCategory, Property, PropertyImage } from "../../types";
import "./PropertyGallery.css";

const ROOM_CATEGORIES: PhotoRoomCategory[] = ["Living Areas", "Bedrooms", "Kitchen", "Outdoor", "Other"];

interface PropertyGalleryProps {
  property: Property;
}

/** Full listing photo gallery — a large image plus a thumbnail strip, unlike
 * PropertyPhoto (used on cards/popups) which only ever shows the cover photo.
 * Renders the curated, room-labeled gallery when every photo has a label and
 * room assigned; falls back to a plain carousel otherwise so an incomplete
 * upload never breaks the page. */
export function PropertyGallery({ property }: PropertyGalleryProps) {
  const photos = property.images;

  if (photos.length === 0) {
    return (
      <div className="property-gallery">
        <PropertyImagePlaceholder propertyType={property.propertyType} className="property-gallery__main" />
      </div>
    );
  }

  const hasLabels = photos.every((photo) => Boolean(photo.label && photo.room));

  return hasLabels ? (
    <LabeledGallery title={property.title} photos={photos} />
  ) : (
    <SimpleGallery title={property.title} urls={photos.map((photo) => photo.url)} />
  );
}

function SimpleGallery({ title, urls }: { title: string; urls: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSrc = urls[Math.min(activeIndex, urls.length - 1)];

  function showPrev() {
    setActiveIndex((i) => (i - 1 + urls.length) % urls.length);
  }

  function showNext() {
    setActiveIndex((i) => (i + 1) % urls.length);
  }

  return (
    <div className="property-gallery">
      <div className="property-gallery__main-wrap">
        <img
          src={activeSrc}
          alt={`${title} — photo ${activeIndex + 1} of ${urls.length}`}
          className="property-gallery__main"
        />
        {urls.length > 1 ? (
          <>
            <button
              type="button"
              className="property-gallery__nav property-gallery__nav--prev"
              onClick={showPrev}
              aria-label="Previous photo"
            >
              <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="property-gallery__nav property-gallery__nav--next"
              onClick={showNext}
              aria-label="Next photo"
            >
              <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
            </button>
            <span className="property-gallery__counter">
              {activeIndex + 1} / {urls.length}
            </span>
          </>
        ) : null}
      </div>

      {urls.length > 1 ? (
        <div className="property-gallery__thumbs" role="tablist" aria-label="Listing photos">
          {urls.map((src, index) => (
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

function LabeledGallery({ title, photos }: { title: string; photos: PropertyImage[] }) {
  const categoriesPresent = useMemo(() => {
    const present = new Set(photos.map((photo) => photo.room));
    return ROOM_CATEGORIES.filter((category) => present.has(category));
  }, [photos]);

  const [activeCategory, setActiveCategory] = useState<PhotoRoomCategory | "All">("All");
  const [activeIndex, setActiveIndex] = useState(0);

  const visible = activeCategory === "All" ? photos : photos.filter((photo) => photo.room === activeCategory);
  const activePhoto = visible[Math.min(activeIndex, visible.length - 1)];

  function selectCategory(category: PhotoRoomCategory | "All") {
    setActiveCategory(category);
    setActiveIndex(0);
  }

  function showPrev() {
    setActiveIndex((i) => (i - 1 + visible.length) % visible.length);
  }

  function showNext() {
    setActiveIndex((i) => (i + 1) % visible.length);
  }

  return (
    <div className="property-gallery">
      {categoriesPresent.length > 1 ? (
        <div className="property-gallery__tabs" role="tablist" aria-label="Photo categories">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "All"}
            className={`property-gallery__tab${activeCategory === "All" ? " property-gallery__tab--active" : ""}`}
            onClick={() => selectCategory("All")}
          >
            All
          </button>
          {categoriesPresent.map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              className={`property-gallery__tab${activeCategory === category ? " property-gallery__tab--active" : ""}`}
              onClick={() => selectCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      ) : null}

      <div className="property-gallery__main-wrap">
        <img
          src={activePhoto.url}
          alt={`${title} — ${activePhoto.label}`}
          className="property-gallery__main"
        />
        <span className="property-gallery__caption">{activePhoto.label}</span>
        {visible.length > 1 ? (
          <>
            <button
              type="button"
              className="property-gallery__nav property-gallery__nav--prev"
              onClick={showPrev}
              aria-label="Previous photo"
            >
              <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="property-gallery__nav property-gallery__nav--next"
              onClick={showNext}
              aria-label="Next photo"
            >
              <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
            </button>
            <span className="property-gallery__counter">
              {activeIndex + 1} / {visible.length}
            </span>
          </>
        ) : null}
      </div>

      {visible.length > 1 ? (
        <div className="property-gallery__thumbs" role="tablist" aria-label="Listing photos">
          {visible.map((photo, index) => (
            <button
              key={`${photo.url}-${photo.label}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={photo.label}
              className={`property-gallery__thumb${index === activeIndex ? " property-gallery__thumb--active" : ""}`}
              onClick={() => setActiveIndex(index)}
            >
              <img src={photo.url} alt="" loading="lazy" />
              <span className="property-gallery__thumb-caption">{photo.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
