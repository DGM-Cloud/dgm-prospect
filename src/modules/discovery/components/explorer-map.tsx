"use client";

import { useEffect, useMemo } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { DiscoveryBusiness, GeoPoint } from "../types/client";

import "leaflet/dist/leaflet.css";

const centerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function pinIcon(color: string, selected = false) {
  const size = selected ? 34 : 26;
  const height = selected ? 44 : 34;
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${height}" viewBox="0 0 24 36">
      <path fill="${color}" stroke="#ffffff" stroke-width="1.5"
        d="M12 1C6.5 1 2 5.5 2 11c0 7.5 10 23 10 23s10-15.5 10-23C22 5.5 17.5 1 12 1z"/>
      <circle cx="12" cy="11" r="4.2" fill="#ffffff"/>
    </svg>
  `);

  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [size, height],
    iconAnchor: [size / 2, height],
    popupAnchor: [0, -height + 8],
  });
}

type ExplorerMapProps = {
  center: GeoPoint;
  radiusKm: number;
  businesses: DiscoveryBusiness[];
  selectedId: string | null;
  onCenterChange: (point: GeoPoint) => void;
  onSelect: (business: DiscoveryBusiness) => void;
};

function MapClickHandler({
  onCenterChange,
}: {
  onCenterChange: (point: GeoPoint) => void;
}) {
  useMapEvents({
    click(event) {
      onCenterChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });
  return null;
}

function Recenter({ center, radiusKm }: { center: GeoPoint; radiusKm: number }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLng(center.latitude, center.longitude).toBounds(
      radiusKm * 1000,
    );
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
  }, [center.latitude, center.longitude, radiusKm, map]);

  return null;
}

function FocusSelected({
  businesses,
  selectedId,
}: {
  businesses: DiscoveryBusiness[];
  selectedId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const selected = businesses.find(
      (business) =>
        `${business.osmType}-${business.osmId}` === selectedId,
    );
    if (!selected) {
      return;
    }
    map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 16), {
      duration: 0.55,
    });
  }, [businesses, selectedId, map]);

  return null;
}

export function ExplorerMap({
  center,
  radiusKm,
  businesses,
  selectedId,
  onCenterChange,
  onSelect,
}: ExplorerMapProps) {
  const defaultBusinessIcon = useMemo(() => pinIcon("#1d4ed8", false), []);
  const selectedBusinessIcon = useMemo(() => pinIcon("#dc2626", true), []);

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={14}
      className="h-full w-full rounded-lg"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onCenterChange={onCenterChange} />
      <Recenter center={center} radiusKm={radiusKm} />
      <FocusSelected businesses={businesses} selectedId={selectedId} />
      <Circle
        center={[center.latitude, center.longitude]}
        radius={radiusKm * 1000}
        pathOptions={{
          color: "#1d4ed8",
          fillColor: "#1d4ed8",
          fillOpacity: 0.08,
          weight: 2,
        }}
      />
      <Marker
        position={[center.latitude, center.longitude]}
        icon={centerIcon}
        draggable
        zIndexOffset={200}
        eventHandlers={{
          dragend: (event) => {
            const marker = event.target as L.Marker;
            const latLng = marker.getLatLng();
            onCenterChange({
              latitude: latLng.lat,
              longitude: latLng.lng,
            });
          },
        }}
      >
        <Popup>Centro de búsqueda. Arrastra o haz clic en el mapa.</Popup>
      </Marker>
      {businesses.map((business) => {
        const key = `${business.osmType}-${business.osmId}`;
        const isSelected = selectedId === key;
        return (
          <Marker
            key={`${key}-${isSelected ? "on" : "off"}`}
            position={[business.latitude, business.longitude]}
            icon={isSelected ? selectedBusinessIcon : defaultBusinessIcon}
            zIndexOffset={isSelected ? 1000 : 0}
            opacity={isSelected ? 1 : 0.9}
            eventHandlers={{
              click: () => onSelect(business),
            }}
          >
            <Popup>
              <strong>{business.name ?? "Sin nombre"}</strong>
              <br />
              {business.category ?? "Sin categoría"}
              {isSelected ? (
                <>
                  <br />
                  <span style={{ color: "#dc2626" }}>Seleccionado</span>
                </>
              ) : null}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
