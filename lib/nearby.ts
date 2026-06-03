import { distanceKm, type LatLng } from '@/lib/geo';
import type { CourtLocation } from '@/lib/locations';

export const RADIUS_PRESETS_KM = [2, 5, 10, 15, 25] as const;
export const DEFAULT_RADIUS_KM = 10;
export const MIN_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 30;

export interface CourtWithDistance extends CourtLocation {
  distanceKm: number;
}

export function attachDistance(
  origin: LatLng,
  courts: CourtLocation[]
): CourtWithDistance[] {
  return courts.map((court) => ({
    ...court,
    distanceKm: distanceKm(origin, court),
  }));
}

export function courtsWithinRadius(
  origin: LatLng,
  courts: CourtLocation[],
  radiusKm: number
): CourtWithDistance[] {
  return attachDistance(origin, courts)
    .filter((c) => c.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function zoomForRadiusKm(radiusKm: number): number {
  if (radiusKm <= 3) return 14;
  if (radiusKm <= 8) return 13;
  if (radiusKm <= 15) return 12;
  return 11;
}
