import { Coordinates } from './haversine';

// Origin for the nearest sort: the user's location when both lat and lng are given,
// otherwise the fallback (the city centre).
export function sortOrigin(
  location: { lat?: number; lng?: number },
  fallback: Coordinates,
): Coordinates {
  return location.lat !== undefined && location.lng !== undefined
    ? { lat: location.lat, lng: location.lng }
    : { lat: fallback.lat, lng: fallback.lng };
}
