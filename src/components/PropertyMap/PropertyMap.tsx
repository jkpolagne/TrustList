import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { PropertyPhoto } from "../PropertyPhoto";
import { VerificationBadge } from "../VerificationBadge";
import type { Property } from "../../types";
import { formatPHP } from "../../utils/finance";
import "./PropertyMap.css";

const NAGA_CENTER: [number, number] = [13.6218, 123.1948];

/** Mirrors PropertyCard's status colors so a pin's color means the same thing
 * everywhere in the app — green/amber/muted for Available/Reserved/Sold. */
const STATUS_COLOR: Record<Property["status"], string> = {
  Available: "#1E7F52",
  Reserved: "#B7791F",
  Sold: "#5C6B7D",
};

const ACTIVE_COLOR = "#B8863B";
const ACTIVE_TEXT = "#10233F";
const PAPER_TEXT = "#FAF8F4";

function formatCompactPHP(price: number): string {
  if (price >= 1_000_000) {
    const millions = Math.round((price / 1_000_000) * 10) / 10;
    return `₱${Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (price >= 1_000) {
    return `₱${Math.round(price / 1000)}K`;
  }
  return formatPHP(price);
}

function createPinIcon(property: Property, active: boolean, index: number): L.DivIcon {
  const bg = active ? ACTIVE_COLOR : STATUS_COLOR[property.status];
  const text = active ? ACTIVE_TEXT : PAPER_TEXT;
  const label = formatCompactPHP(property.price);
  const delay = Math.min(index * 35, 300);

  return L.divIcon({
    className: `property-pin${active ? " property-pin--active" : ""}`,
    html: `
      <div class="property-pin__pill" style="background:${bg};color:${text};animation-delay:${delay}ms">${label}</div>
      <div class="property-pin__tail" style="background:${bg};animation-delay:${delay}ms"></div>
    `,
    iconSize: [72, 40],
    iconAnchor: [36, 38],
    popupAnchor: [0, -36],
  });
}

function FitBounds({ properties }: { properties: Property[] }) {
  const map = useMap();

  useEffect(() => {
    if (properties.length === 0) {
      map.setView(NAGA_CENTER, 11);
      return;
    }
    const bounds = L.latLngBounds(
      properties.map((p) => [p.coordinates.lat, p.coordinates.lng] as [number, number]),
    );
    map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 15, duration: 0.6 });
  }, [properties, map]);

  return null;
}

/** Bridges the Leaflet map instance out to the parent so the Reset View button
 * (rendered outside MapContainer) can drive it imperatively. */
function MapReadyBridge({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

interface PropertyMapProps {
  properties: Property[];
  selectedId?: string | null;
  onMarkerClick: (id: string) => void;
}

export function PropertyMap({ properties, selectedId, onMarkerClick }: PropertyMapProps) {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const handleReset = useCallback(() => {
    if (!mapInstance) return;
    if (properties.length === 0) {
      mapInstance.flyTo(NAGA_CENTER, 11, { duration: 0.6 });
      return;
    }
    const bounds = L.latLngBounds(
      properties.map((p) => [p.coordinates.lat, p.coordinates.lng] as [number, number]),
    );
    mapInstance.flyToBounds(bounds, { padding: [48, 48], maxZoom: 15, duration: 0.6 });
  }, [mapInstance, properties]);

  return (
    <div className="property-map-wrap">
      <MapContainer
        center={NAGA_CENTER}
        zoom={11}
        minZoom={9}
        maxZoom={18}
        scrollWheelZoom
        className="property-map"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
        />
        <MapReadyBridge onReady={setMapInstance} />
        <FitBounds properties={properties} />
        {properties.map((property, index) => (
          <Marker
            key={property.id}
            position={[property.coordinates.lat, property.coordinates.lng]}
            icon={createPinIcon(property, property.id === selectedId, index)}
            zIndexOffset={property.id === selectedId ? 1000 : 0}
            eventHandlers={{ click: () => onMarkerClick(property.id) }}
          >
            <Popup maxWidth={230} minWidth={200}>
              <div className="property-map-popup">
                <div className="property-map-popup__photo">
                  <PropertyPhoto property={property} />
                  <span className={`property-map-popup__status property-map-popup__status--${property.status.toLowerCase()}`}>
                    {property.status}
                  </span>
                </div>
                <div className="property-map-popup__body">
                  <div className="property-map-popup__top">
                    <span className="property-map-popup__type">{property.propertyType}</span>
                    {property.listingSource === "Individual Seller" &&
                    property.verificationStatus === "Verified" ? (
                      <VerificationBadge type="ownership" status="verified" />
                    ) : null}
                  </div>
                  <strong className="property-map-popup__title">{property.title}</strong>
                  <span className="property-map-popup__city">{property.city}</span>
                  <span className="property-map-popup__price money">{formatPHP(property.price)}</span>
                  <Link to={`/properties/${property.id}`} className="property-map-popup__link">
                    View Details →
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <button
        type="button"
        className="property-map__reset"
        onClick={handleReset}
        aria-label="Reset map view"
        title="Reset map view"
      >
        <Maximize2 size={15} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
