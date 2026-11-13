import type { GeoPoint } from "@/infrastructure/osm/types";

export type BoundingBox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export function radiusToBBox(center: GeoPoint, radiusKm: number): BoundingBox {
  const latDelta = radiusKm / 111.32;
  const lonScale = Math.max(
    0.01,
    Math.cos((center.latitude * Math.PI) / 180) * 111.32,
  );
  const lonDelta = radiusKm / lonScale;

  return {
    west: center.longitude - lonDelta,
    south: center.latitude - latDelta,
    east: center.longitude + lonDelta,
    north: center.latitude + latDelta,
  };
}

export function haversineKm(
  a: GeoPoint,
  b: { latitude: number; longitude: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
