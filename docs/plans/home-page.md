# Home page

Build the main page (`apps/web/app/(main)/page.tsx`) from the mockup: Categories, Top masters in
<city>, On the map, and a footer. The data comes from the masters service (port 3003).

Only `apps/web` changes. Backend routes and contracts already exist:

- `GET /categories` → `CategoryResponse[]`
- `GET /masters/top?city=<slug>&limit=<n>` → `TopMasterResponse[]` (default limit 4)
- `GET /masters/map?city=<slug>` → `MasterMapPointResponse[]`

## Key decisions

- **City by nearest supported city.** Masters only knows the cities in `CITIES` from
  `@glow-space/shared`, so web always works with one of them. IP geolocation (ipwho.is) returns the
  user's `latitude`/`longitude`, not a city name. `resolveCity` picks the `CITIES` entry closest to
  those coordinates (haversine or plain squared distance), so Kaunas resolves to Vilnius. Web
  identifies a city by **slug**: `DEFAULT_CITY` becomes `"vilnius"`, the `city` cookie stores a slug,
  and the display name comes from `CITIES`. A cookie value that is not a known slug is treated as
  missing. The header and the page use the same resolver, so they always show the same city.
- **API client.** Add `lib/api/masters.ts` in the same style as `lib/api/geolocaation.ts`: an axios
  class, `baseURL: process.env.MASTERS_URL`, default-export instance. These routes are public, so it
  has no auth interceptors. Each method catches the error, logs it and returns `[]`, so a masters
  outage leaves a section empty instead of crashing the page.
- **Data fetching.** `page.tsx` is an async server component. It resolves the city the same way as
  `(main)/layout.tsx` (cookie, then IP, then default) and fetches all three endpoints with
  `Promise.all`. Each section has an empty state.
- **Work photo.** `coverUrl` points to arbitrary hosts (placehold.co SVGs in the seed), so use a plain
  `<img>` with an eslint-disable comment for `@next/next/no-img-element`, not `next/image`. When
  `coverUrl` is null, show the pink "[Work photo]" placeholder.
- **Map.** Use a real map with `leaflet` + `react-leaflet` (v5, React 19) and `@types/leaflet`.
  Leaflet needs `window`, so the map is a `"use client"` component loaded via
  `next/dynamic(..., { ssr: false })`, which has to be called from a client wrapper, not from the
  server page. Import `leaflet/dist/leaflet.css` in that component. Tiles come from CARTO Positron
  (`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`, attribution to
  OpenStreetMap and CARTO), which turned out to need a key (see step 5). Markers are `CircleMarker`s in the accent color with
  a white stroke, which avoids the broken default icon images. The map fits the bounds of the points.
  With no points, it centers on the resolved city's `lat`/`lng` at zoom 12. Scroll-wheel zoom is
  off so the page scrolls normally. Height is ~210px with rounded corners.
- **"See all" links** are left out because no catalog pages exist yet.
- **Card text.** The card shows the master's first category name. Rating shows ★ `rating`
  (one decimal) and (`reviewsCount`), or "New" when `rating` is null.
- **Footer.** Add `components/Footer` with "© <year> glowspace" and links to `/privacy` and `/terms`,
  rendered in `(main)/layout.tsx` below `children`.
- **Styling.** SCSS modules with BEM-ish `&__element` naming, like the existing components.
  Category tiles alternate pink `#f6e1e8` and beige `#efe7e0`. Accent `#d4537e`. Headings use Fraunces
  (as on the register page).

## Steps

1. [x] **Masters API client and city resolution.** Create `apps/web/lib/api/masters.ts` with
   `getCategories()`, `getTopMasters(citySlug, limit?)` and `getMapPoints(citySlug)`, typed with the
   shared contracts. Add `MASTERS_URL=http://localhost:3003` to `apps/web/.env.example`. Change
   `GeolocationApi` to return `{ lat, lng } | null` (from ipwho.is `latitude`/`longitude`). Add
   `apps/web/lib/city.ts` with `findNearestCity(lat, lng)` and `getCityBySlug(slug)` over `CITIES`.
   Change `DEFAULT_CITY` to the slug `"vilnius"`. Replace `getCityFromIpAction` in
   `(main)/actions.ts` with a `resolveCurrentCity()` that returns a `CITIES` entry: a valid cookie slug
   first, then the nearest city to the IP location, then `DEFAULT_CITY`. Update `(main)/layout.tsx`
   to pass `city.name` to the header. Add a spec for `findNearestCity` only if the web gets a test
   runner (it has none now). Run lint and `tsc --noEmit`.
2. [x] **Categories and top masters sections.** Create `app/components/CategoriesSection`
   (tiles grid, 6 per row on desktop, wrapping on narrow screens) and
   `app/components/TopMastersSection` with a `MasterCard` (photo, name, first category, rating).
   These are server components with no `"use client"`.
3. [x] **Map section.** Install `leaflet`, `react-leaflet` and `@types/leaflet` (dev) in `apps/web`.
   Create `app/components/MapSection`: a server-safe section wrapper (title "On the map") plus a
   client `MastersMap` loaded with `next/dynamic` and `ssr: false`, as described in Key decisions,
   and a small "Map" chip over the top-left corner as in the mockup.
   Props are `points: MasterMapPointResponse[]` and `center: { lat, lng }`. Handle 0, 1 and many
   points. Show a placeholder of the same size while it loads.
4. [x] **Page and footer.** Create `app/components/Footer` and add it to `(main)/layout.tsx`. Rewrite
   `(main)/page.tsx` to call `resolveCurrentCity()`, fetch the three endpoints in parallel and render
   the sections in a centered container (max-width ~840px, matching the header padding). Run lint,
   `tsc --noEmit` and `npm run build` for `apps/web`.
5. [x] **Map fixes after manual check.** CARTO basemaps now return an "API KEY REQUIRED" tile
   without a key. Move the tile URL to `NEXT_PUBLIC_MAP_TILE_URL`, with the standard OpenStreetMap
   URL (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, attribution "© OpenStreetMap
   contributors") as the fallback when the variable is unset. Also add the variable to
   `apps/web/.env.example`. Move the zoom control to the top right so it no longer covers the
   "Map" chip. Call `map.invalidateSize()` before `setView`/`fitBounds`, because the dynamically
   loaded map can measure its container before it has a size, which cuts off markers. A keyed
   provider (MapTiler, Stadia or CARTO) is for production and is a separate task.
