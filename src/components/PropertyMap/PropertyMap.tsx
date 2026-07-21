import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Property } from "../../types";
import { formatPHP } from "../../utils/finance";
import "./PropertyMap.css";

const NAGA_CENTER: [number, number] = [13.6218, 123.1948];

function createPinIcon(active: boolean): L.DivIcon {
  const fill = active ? "#B8863B" : "#10233F";
  return L.divIcon({
    className: "property-pin",
    html: `<svg width="26" height="34" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${fill}" stroke="#FAF8F4" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="5" fill="#FAF8F4"/>
    </svg>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
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
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [properties, map]);

  return null;
}

interface PropertyMapProps {
  properties: Property[];
  selectedId?: string | null;
  onMarkerClick: (id: string) => void;
}

export function PropertyMap({ properties, selectedId, onMarkerClick }: PropertyMapProps) {
  return (
    <MapContainer
      center={NAGA_CENTER}
      zoom={11}
      scrollWheelZoom
      className="property-map"
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <FitBounds properties={properties} />
      {properties.map((property) => (
        <Marker
          key={property.id}
          position={[property.coordinates.lat, property.coordinates.lng]}
          icon={createPinIcon(property.id === selectedId)}
          eventHandlers={{ click: () => onMarkerClick(property.id) }}
        >
          <Popup>
            <div className="property-map-popup">
              <strong>{property.title}</strong>
              <span className="money">{formatPHP(property.price)}</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
