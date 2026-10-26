# AI search: location and free slot

The `area` and `day` chips of the AI search start filtering instead of being display-only:

- **location:** "near Paneriu 45" or "near the center" sorts masters by distance from that point;
- **free slot:** "on Saturday" keeps only masters with a free slot that day, and Best match shows
  the earliest one ("Sat 12:00").

Scope: `packages/shared`, `apps/masters`, `apps/web`. Bookings are only read; no booking
endpoints or modules. Search stays in `apps/masters` for now, but the geocoding code must not
depend on Prisma, so it can move to a separate search service later.

## Key decisions

### Location

- **Geocoder: Geoapify** (free plan: 3000 requests/day, 5/s, commercial use allowed, Geoapify
  and OpenStreetMap attribution required). The terms say nothing about caching, so results are
  not stored.
  - `GET https://api.geoapify.com/v1/geocode/search?text=&filter=circle:<lng>,<lat>,30000&bias=proximity:<lng>,<lat>&format=json&limit=1&apiKey=`
  - The key is `GEOAPIFY_API_KEY` in `apps/masters/.env`, server-side only; `.env.example`
    gets the name without a value.
  - The 30 km circle around the selected city is required: without it "Moskovskaya metro,
    Minsk" returned Saint Petersburg first with confidence 0.6.
  - Checked with curl: "Paneriu 45" → "Panerių g. 45, Vilnius", `result_type: building`,
    `confidence: 0.71`.
- **`GeocodingService`** (no Prisma): `geocode(text, near: Coordinates)` →
  `{ lat, lng, label } | null`. A 3 s timeout, an HTTP error, no result or
  `rank.confidence < 0.5` → `null`. Errors are logged, not thrown: a broken geocoder must not
  break the search.
- **Parser (mock):** the place is the text after `near`, `close to`, `next to`, `рядом с`,
  `возле`, `около`, `недалеко от`, up to a comma or the end.
  - `center`, `centre`, `центр` → the city's `lat/lng`, no geocoder call. Label "Near center".
  - Another place → geocoder. Label "Near <address_line1>", e.g. "Near Panerių g. 45".
  - Geocoder returned `null` → the chip stays display-only ("Near Paneriu 45"), as today.
- **Contract:** `SearchFiltersResponse.origin?: { lat: number; lng: number }`, and
  `SearchParseResponse` (ok) gets `geocoded: boolean` for the attribution.
- **Web:** with `origin`, `/search` uses `sort=nearest` with that `lat/lng` unless the user
  picked another sort. The query's point beats the browser location. Removing the `area` chip
  drops `origin`. When `geocoded` is true, show "Powered by Geoapify · © OpenStreetMap" under
  the chips.
- No radius filter for now, only the sort.

### Free slot

- **Day → dates.** The parser turns the day word into a local date range in the city's
  timezone: `today`, `tomorrow`, a weekday (the next one, today included), `weekend` (the next
  Saturday and Sunday). The timezone comes from a new `timezone` field in the `CITIES` seed
  (`Europe/Vilnius`, `Europe/Riga`, `Europe/Tallinn`), looked up by slug; no DB column, no
  migration.
- **Contract:** `SearchFiltersResponse` gets `dateFrom?` / `dateTo?` (`YYYY-MM-DD`, inclusive).
- **`GET /masters` filters:** `dateFrom` and `dateTo`. Both or neither, `dateTo >= dateFrom`,
  at most 7 days, not before today in the city's timezone → otherwise 400.
- **What counts as a free slot** (in SQL, in `findPage`, next to the existing filters):
  - working intervals of the date: the `schedule_exceptions` row if there is one (day off → none,
    otherwise its single interval), else `working_hours` for the ISO weekday;
  - slot length: the master's shortest eligible offering (`duration_min` of offerings that pass
    the category, subcategory and price filters);
  - start times on a 30-minute grid from the interval start; the slot must end inside the
    interval;
  - no overlap with `PENDING` / `CONFIRMED` bookings (same `[start, end)` rule as the EXCLUDE
    constraint);
  - for today: only starts after the current local time.
  - With dates set, a master without a free slot is not eligible, so `total` and paging stay right.
- **Response:** `MasterListCardResponse.nextSlot: string | null`, the earliest free start as
  local `YYYY-MM-DDTHH:MM`; `null` when no dates are given.
- **Web:** the `day` chip passes `dateFrom/dateTo`; removing it drops them. Best match shows
  `nextSlot` as "Sat 12:00" (the line the AI search plan skipped for lack of data). Grid cards
  don't show it.

## Steps

1. [x] **Shared.** `timezone` in `CitySeed`/`CITIES`; `origin`, `geocoded`, `dateFrom`, `dateTo` in
   the search contract; `nextSlot` in `MasterListCardResponse`. Rebuild shared and check that
   `apps/masters`, `apps/user` and `apps/web` compile.
2. [x] **Masters: geocoding.** `GeocodingService` (+ spec with a mocked `fetch`: ok, low confidence,
   no result, HTTP error, timeout), env var and `.env.example`. Lint and tests pass.
3. [x] **Masters: parser.** Place extraction, center vs geocoder, day → date range in the city's
   timezone, `origin`/`geocoded`/`dateFrom`/`dateTo` in `SearchResponder`. Specs: "Gel manicure
   near Paneriu 45, under €35, Saturday", "near the center", geocoder `null`, each day word with a
   fixed clock. Lint and tests pass. Check with curl.
4. [x] **Masters: `GET /masters` slots.** `dateFrom`/`dateTo` in `MastersListQueryDTO` (+ spec),
   validation in the service, slot CTE and `nextSlot` in `findPage`, `nextSlot` in the responder.
   Specs for the service, repository and controller. Check in the dev DB: a master with a free
   Saturday is returned with the right `nextSlot`; after inserting a covering `CONFIRMED` booking
   by hand it is not; a day off from `schedule_exceptions` is respected. Delete the test booking.
   Lint and tests pass.
5. [x] **Web.** API client params, `origin` → nearest sort, `dateFrom/dateTo`, chip removal,
   `nextSlot` on Best match, attribution line. Lint passes. Open `/search` at 390 and 1280px and
   compare with the results mockup.
