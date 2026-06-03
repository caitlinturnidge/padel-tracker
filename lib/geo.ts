export interface LatLng {
  lat: number;
  lng: number;
}

export function normalizePostcode(postcode: string): string {
  return postcode.replace(/\s+/g, '').toUpperCase();
}

export async function lookupUkPostcode(
  postcode: string
): Promise<LatLng | null> {
  const code = normalizePostcode(postcode);
  if (code.length < 5) return null;

  const response = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(code)}`
  );
  if (!response.ok) return null;

  const data = await response.json();
  if (data.status !== 200 || !data.result) return null;

  return {
    lat: data.result.latitude,
    lng: data.result.longitude,
  };
}

/** Great-circle distance in kilometres */
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function directionsUrl(
  destination: LatLng,
  origin?: LatLng
): string {
  const dest = `${destination.lat},${destination.lng}`;
  if (origin) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}
