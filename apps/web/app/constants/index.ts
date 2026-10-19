export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
export const USER_COOKIE = "user";
export const CITY_COOKIE = "city";
export const DEFAULT_CITY = "vilnius";
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const ACCESS_COOKIE_MAX_AGE = 15 * 60;
export const GEOLOCATION_URL = "https://ipwho.is";
export const GOOGLE_STATE_COOKIE = "google_state";
export const GOOGLE_STATE_MAX_AGE = 60 * 60 * 24 * 7;
export const REGISTER_RETRY_COUNT = 4;
// NEXT_PUBLIC_ vars must be referenced literally so Next inlines them into the client bundle.
export const MAP_TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ||
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const MAP_TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const MAP_MARKER_COLOR = "#d4537e";
export const MAP_MARKER_RADIUS = 7;
export const MAP_MARKER_ACTIVE_COLOR = "#1a1a1a";
export const MAP_MARKER_ACTIVE_RADIUS = 9;
export const MAP_POPUP_AUTO_PAN_PADDING = 16;
// keeps the open card below the "Map" chip in the top-left corner
export const MAP_POPUP_AUTO_PAN_PADDING_TOP = 44;
export const MAP_DEFAULT_ZOOM = 12;
export const MAP_SINGLE_POINT_ZOOM = 14;
export const MAP_MAX_FIT_ZOOM = 15;
