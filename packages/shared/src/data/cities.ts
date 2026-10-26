// Seed data for the cities table. Each service that needs cities keeps its own copy,
// seeded from this list. Services refer to a city by `slug`, never by id.
export type CitySeed = {
  slug: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  // IANA zone. Schedules are local wall-clock time, so "today" and "now" are computed
  // in this zone. Not stored in the cities tables.
  timezone: string;
};

export const CITIES: CitySeed[] = [
  { slug: "vilnius", name: "Vilnius", country: "LT", lat: 54.6872, lng: 25.2797, timezone: "Europe/Vilnius" },
  { slug: "riga", name: "Riga", country: "LV", lat: 56.9496, lng: 24.1052, timezone: "Europe/Riga" },
  { slug: "tallinn", name: "Tallinn", country: "EE", lat: 59.437, lng: 24.7536, timezone: "Europe/Tallinn" },
  { slug: "warsaw", name: "Warsaw", country: "PL", lat: 52.2297, lng: 21.0122, timezone: "Europe/Warsaw" },
  { slug: "berlin", name: "Berlin", country: "DE", lat: 52.52, lng: 13.405, timezone: "Europe/Berlin" },
  { slug: "paris", name: "Paris", country: "FR", lat: 48.8566, lng: 2.3522, timezone: "Europe/Paris" },
  { slug: "london", name: "London", country: "GB", lat: 51.5074, lng: -0.1278, timezone: "Europe/London" },
  { slug: "madrid", name: "Madrid", country: "ES", lat: 40.4168, lng: -3.7038, timezone: "Europe/Madrid" },
  { slug: "rome", name: "Rome", country: "IT", lat: 41.9028, lng: 12.4964, timezone: "Europe/Rome" },
  { slug: "amsterdam", name: "Amsterdam", country: "NL", lat: 52.3676, lng: 4.9041, timezone: "Europe/Amsterdam" },
  { slug: "prague", name: "Prague", country: "CZ", lat: 50.0755, lng: 14.4378, timezone: "Europe/Prague" },
  { slug: "vienna", name: "Vienna", country: "AT", lat: 48.2082, lng: 16.3738, timezone: "Europe/Vienna" },
  { slug: "stockholm", name: "Stockholm", country: "SE", lat: 59.3293, lng: 18.0686, timezone: "Europe/Stockholm" },
  { slug: "kyiv", name: "Kyiv", country: "UA", lat: 50.4501, lng: 30.5234, timezone: "Europe/Kyiv" },
  { slug: "istanbul", name: "Istanbul", country: "TR", lat: 41.0082, lng: 28.9784, timezone: "Europe/Istanbul" },
  { slug: "tbilisi", name: "Tbilisi", country: "GE", lat: 41.7151, lng: 44.8271, timezone: "Asia/Tbilisi" },
  { slug: "new-york", name: "New York", country: "US", lat: 40.7128, lng: -74.006, timezone: "America/New_York" },
  { slug: "toronto", name: "Toronto", country: "CA", lat: 43.6532, lng: -79.3832, timezone: "America/Toronto" },
  { slug: "dubai", name: "Dubai", country: "AE", lat: 25.2048, lng: 55.2708, timezone: "Asia/Dubai" },
  { slug: "tokyo", name: "Tokyo", country: "JP", lat: 35.6762, lng: 139.6503, timezone: "Asia/Tokyo" },
];
