# Masters page

A `/masters` page that lists all masters in the current city. It has a category filter and a sort
select, and works like the category page (`apps/web/app/(main)/categories/[slug]/`).

Mockups (attached in the conversation): mobile (390px, 2 columns, chips scroll, sort below
the chips with the "12 of 1,100" counter on the left), tablet (~768px, 3 columns, chips scroll and
sort in one row), desktop (4 columns, 6 chips + "More", sort on the right).

Touches `packages/shared`, `apps/masters`, `apps/web`.

## Key decisions

- **Sorts.** Add `nearest` to `MASTER_SORTS` in shared. Both pages (`/masters` and the category
  page) get it. Order and labels: Top rated (default), Most reviews, Price: low to high,
  Price: high to low, Newest, Nearest.
  - Top rated: the same Bayesian score as the category page. The prior is the average rating of
    eligible masters in the city, or of the selected category when one is chosen.
  - Price sorts use `minPrice`, the cheapest active offering. When a category is selected, only
    offerings in that category count; without a filter, all active offerings count.
  - Newest: `created_at DESC`.
  - Nearest: straight-line (haversine) distance from an origin, then `id`. The origin is the
    browser geolocation if the user allowed it, otherwise the centre of the current city. That
    means a city is always known, so the option is always shown.
- **Geolocation.** When the user picks Nearest, the sort select asks
  `navigator.geolocation.getCurrentPosition`. If it succeeds, it navigates with `lat`/`lng` in the
  URL, rounded to 3 decimals. If it fails or is denied, it navigates without them, and the backend
  uses the city centre. `lat`/`lng` are read only when `sort=nearest`, and must be sent together.
- **Eligibility.** Active masters in the city with at least one active offering. With a category
  filter, the offering must be in that category.
- **Backend.**
  - Generalize `MasterRepository.findCategoryPage` into one paged query with an optional
    `categoryId` and `subcategoryId` and an `origin` for nearest. Both the category endpoint and the
    new endpoint use it, and its existing spec is updated.
  - New `GET /masters?city&category&sort&offset&limit&lat&lng` in `MasterController` (`@Get()`).
    An unknown category returns 404. Default limit 12, max 24.
  - `GET /categories/:slug/masters` also accepts `lat`/`lng`.
- **Contract.** New in `responses/masters.ts`:
  `MasterListCardResponse = MasterCardResponse & { minPrice: number; currency: string }` and
  `MastersListResponse = { total: number; masters: MasterListCardResponse[] }`. `categories` on
  the card are already in `MasterCardResponse`, in category `sortOrder`.
- **Card.** It reuses the category card layout (cover, name, subtitle, rating, "from €X"). The
  subtitle is the selected category's name when a filter is set, otherwise the master's categories
  (up to 3, comma-separated). Clicking a card does nothing yet, the same as on the category page.
- **Chips.** "All" plus categories that have masters in the city. The list comes from the existing
  `GET /categories/overview` (`mastersCount > 0`), in category `sortOrder`. The filter is a URL
  param `?category=<slug>`. An unknown slug falls back to "All".
  - ≤768px: all chips in one row with horizontal scroll, as on the category page.
  - Desktop: the first 6 chips, then a "More" button that opens a dropdown with the rest. When the
    active category is in "More", the "More" chip is shown as active and labelled with that
    category's name.
- **URL.** `/masters?category=&sort=&lat=&lng=`. Defaults (All, top_rated) are left out so the
  plain URL stays canonical, like `categoryHref`.
- **Paging.** Page size 12 on `/masters`. The category page stays at 8. "Show more" appends pages
  through a server action, like `MastersGrid`. The counter "12 of 1,100" (shown / total) appears
  next to the sort select on both pages:
  - Mobile: counter on the left, sort on the right, in the row below the chips.
  - Tablet and desktop: the counter is not shown (it isn't in those mockups).
- **Heading.** Breadcrumb "Home / Masters". Title "Masters in {city}". Subtitle
  "1,100 masters, sorted by rating" (`SORT_SUBTITLES`, plus `nearest: "distance"`).
- **Empty state.** If the city has no eligible masters: "No masters in {city} yet". There is no
  other-cities block.
- **Reuse.** Move the shared bits out of `categories/[slug]/` into common places instead of
  copying them: `SortSelect`, the sort labels and `parseSort`, the master card and the grid. Keep
  the names and the BEM-like SCSS style.
- **Entry points.** "See all" in `TopMastersSection` becomes a `Link` to `/masters`. "Top masters"
  in `MobileMenu` becomes a `Link` to `/masters` and closes the menu, like "Categories".
- Breakpoints 768px and 480px, as in `responsive-category.md`. Check at 1440, 1024, 768, 480 and
  390px. The page must not scroll horizontally.

## Steps

1. ✅ **Done.** **Shared contract.** Add `nearest` to `MASTER_SORTS`, and add `MasterListCardResponse` and
   `MastersListResponse`. Rebuild shared. Check that `apps/masters` and `apps/web` still compile:
   `SORT_LABELS` and `CATEGORY_MASTERS_ORDER` are `Record<MasterSort, …>`, so they need the new
   key. This step adds a `nearest` entry to both.
2. ✅ **Done.** **Masters: generalized page query + nearest.**
   - `findCategoryPage` becomes a general paged query: optional category and subcategory, plus
     `origin {lat,lng}`, and an ORDER BY for nearest.
   - Category masters DTO gets optional `lat`/`lng` (valid ranges, both or neither).
   - `CategoryService.getMasters` passes the origin (from the query, else the city centre).
   - Update the repository, service and DTO specs.
3. ✅ **Done.** **Masters: `GET /masters` endpoint.**
   - `MastersListQueryDTO`, `MasterService.getList`, which loads cards in the sorted order (like
     `CategoryService.getMasters`), `MasterResponder.listCardResponse`, and the controller route.
   - Specs for the service, controller and DTO.
4. ✅ **Done.** **Web: shared pieces + category page update.**
   - Move `SortSelect`, the sort labels, `parseSort` and the grid and card into shared locations.
   - Nearest with geolocation in `SortSelect`.
   - Pass `lat`/`lng` through the category page and its load-more action.
   - Add the counter to the category page.
   - Add `getMasters` to `lib/api/masters`.
5. ✅ **Done.** **Web: `/masters` page.**
   - The page, the chips with "More", the grid with "Show more" through a server action, the empty
     state, and metadata.
   - Responsive styles to match the 3 mockups.
6. ✅ **Done.** **Web: entry points.** "See all" and the mobile menu "Top masters" link to `/masters`.
