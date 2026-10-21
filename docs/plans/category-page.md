# Category page

A page per category, `/categories/[slug]`, opened by clicking a category tile. It lists the
category's masters in the current city with a subcategory filter, a sort, and "Show more" paging
(8 at a time). When the category has no masters in the city, it shows an empty state with the
nearest other cities that have masters in it.

Mockups: list (Nails in Vilnius) and empty state (Tattoo and piercing in Vilnius), attached in
the conversation.

Touches `packages/shared`, `apps/masters`, `apps/web`.

## Key decisions

- **A master belongs to the category page** when they are `ACTIVE`, in the city, and have at
  least one active offering (`isActive = true`) in the category. Masters with the category but no
  offerings in it are not shown. Offerings already imply `MasterCategory` through the composite FK.
- **Subcategory filter** (one at a time, `?sub=<slug>`): masters with at least one active offering
  in that subcategory. "from" price is then the minimum over offerings in that subcategory only;
  without a filter, the minimum over all the master's active offerings in the category.
- **Subcategory chips** show only subcategories that have at least one such master in the city,
  in `sortOrder`. If `?sub` is unknown or not among them, web ignores it and shows All.
- **Card subtitle**: the master's subcategories (distinct, from active offerings in this category,
  in subcategory `sortOrder`), always the full list regardless of the filter; web shows the first
  3 joined with ", ". Card image is `photoUrl` only; when null, the existing placeholder.
- **Sorts** (`?sort=`), a union type in shared:
  - `top_rated` (default): Bayesian score `(v·R + m·C) / (v + m)`, `v` = `reviewsCount`,
    `R` = `rating`, `m = 10`, `C` = average rating of rated eligible masters in the city and
    category (ignoring the subcategory filter). Unrated masters go last, newest first among them.
  - `most_reviews`: `reviewsCount` desc. Label "Most reviews" (no bookings exist yet).
  - `price_asc` / `price_desc`: by the "from" price.
  - `newest`: `createdAt` desc.
  - Every sort ends with `id` as a tie-breaker so offset paging is stable.
  - "Nearest" is not built.
- **Sorting and paging happen in SQL.** One raw query in the repository returns the page of
  `(id, minPrice, currency, total)` (`COUNT(*) OVER ()` for total), with `ORDER BY` picked from a
  whitelist of `Prisma.sql` fragments, never interpolated from input. The cards are then loaded by
  id with a dedicated `include` (active offerings in the category with their subcategory) and
  re-ordered to match.
- **Price**: API returns `minPrice` in cents and `currency` (ISO code). Within a city the currency is
  the same, so sorting ignores it. Web formats with `Intl.NumberFormat("en", { style: "currency" })`,
  no fraction digits when the amount is whole ("€25"), two otherwise ("€25.50").
- **Other cities** (empty state only): the 3 nearest cities to the current one (by `City.lat/lng`,
  haversine computed in the service) that have at least one eligible master in the category, with
  the count. Hidden when none.
- **Clicking another city** calls a web server action that sets the `city` cookie (1 year) and
  reloads the same category page. This is the first place that writes the city cookie.
- **Empty state** (no masters in the whole category in the city): no chips, sort or count; the
  card from the mockup with "Browse categories" (link to `/categories`) and "Become a master"
  (stub button, no action, like the header's).
- **URL state**: `/categories/[slug]?sub=&sort=`, rendered on the server. Chips and sort change the
  URL; "Show more" calls a server action with the next `offset` and appends on the client.
  The action receives the city slug from the client (validated against `CITIES`) so the next page
  matches the city that was rendered.
  Unknown category slug → `notFound()` (masters returns 404).
- **Subtitle**: "{N} masters, sorted by {rating | number of reviews | price, low to high |
  price, high to low | newest}", N being the total for the current filter.
- **Seed is not extended.** Vilnius has fewer than 8 masters per category, so "Show more" is
  verified via the API with a small `limit`, not visually.

## API (apps/masters)

- `GET /categories/:slug?city=` → `CategoryPageResponse`
  `{ category: CategoryResponse & { description }, subcategories: SubcategoryResponse[] }`
  (subcategories = chips as defined above). 404 for unknown category or city.
- `GET /categories/:slug/masters?city=&sub=&sort=&offset=0&limit=8` →
  `CategoryMastersResponse { total: number, masters: CategoryMasterCardResponse[] }`.
  `CategoryMasterCardResponse = MasterCardResponse & { subcategories: SubcategoryResponse[],
  minPrice: number, currency: string }`. `limit` 1–24. Unknown `sub` → 404.
- `GET /categories/:slug/cities?city=&limit=3` → `CityWithCountResponse[]`
  `{ slug, name, mastersCount }`, excluding the current city. `limit` 1–10, default 3.

## Steps

1. ✅ **Done.** **Shared contracts.** In `packages/shared/src/responses/masters.ts` add `SubcategoryResponse`,
   `CategoryPageResponse`, `CategoryMasterCardResponse`, `CategoryMastersResponse`,
   `CityWithCountResponse`; in `types/master.ts` (or a fitting place) the `MasterSort` union and
   a `MASTER_SORTS` array. Export from the index. Rebuild shared; `apps/masters` and `apps/web`
   still compile.
2. ✅ **Done.** **Masters: category endpoint.** `GET /categories/:slug` as above: repository method for the
   category by slug and one for subcategories having eligible masters in the city; service throws
   `NotFoundException` for an unknown category; responder builds the contract. Specs for service
   and controller.
3. ✅ **Done.** **Masters: masters list endpoint.** `GET /categories/:slug/masters` with a query DTO
   (`city`, optional `sub`, `sort` validated against `MASTER_SORTS` defaulting to `top_rated`,
   `offset` ≥ 0 default 0, `limit` 1–24 default 8). Raw paged query + card load as in key
   decisions; responder adds `subcategories`, `minPrice`, `currency`. Specs cover each sort's
   order clause selection, the sub filter, 404s, and order restoration. Check every sort against
   the seeded DB with `curl` (including `limit=1&offset=1`).
4. ✅ **Done.** **Masters: other cities endpoint.** `GET /categories/:slug/cities`: repository groups eligible
   masters by city for the category; service drops the current city, sorts by haversine distance,
   takes `limit`. Haversine as a small util in `apps/masters` with a spec.
5. ✅ **Done.** (Also added `categories/[slug]/error.tsx`; `getCategoryMasters` throws on errors.)
   **Web: plumbing.** `lib/api/masters.ts` methods for the 3 endpoints (category 404 → `null`);
   `formatPrice` in `lib/format.ts`; `selectCity` server action setting the city cookie; category
   tiles in `CategoriesCatalog` and the home `CategoriesSection` become links to
   `/categories/[slug]`.
6. ✅ **Done.** **Web: category page with masters.** `app/(main)/categories/[slug]/page.tsx`: breadcrumb,
   title "{Category} in {City}", subtitle, subcategory chips (links), sort dropdown, 4-column grid
   of category master cards (photo, name, subcategories, rating, "from €X"), "Show more" server
   action appending 8. Matches the list mockup.
7. ✅ **Done.** **Web: empty state and other cities.** Empty state card and "Available in other cities" cards
   calling `selectCity`. Matches the empty mockup. Open both pages (with data and empty) and
   compare with the mockups.
