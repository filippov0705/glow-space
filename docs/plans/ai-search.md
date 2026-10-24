# AI search

Natural-language master search, following the mockups. The page has four states:

- **home:** a hero on `/` with the title, a search bar and suggestion chips.
- **loading:** the "Searching..." state with skeletons.
- **results:** "We understood" chips, a Best match card and the "More masters (N)" grid.
- **clarifying question:** a "What are you looking for?" card with category buttons.

Converting text into filters is **mocked** for now: keyword matching in `apps/masters`. It will be
replaced by an LLM later behind the same contract. Search itself runs through the existing
`GET /masters`, which gets two new filters, `subcategory` and `priceMax`.

Scope: `packages/shared`, `apps/masters`, `apps/web`.

## Key decisions

- **Routes.** The hero is added at the top of the home page. The existing sections
  (categories, top masters, map) stay below it. Results and the clarifying question live on
  `/search`, which takes these URL params:
  - `q`: the query text (required; trim it first, and redirect to `/` if it is empty or
    whitespace-only, since a no-JS submit can send `q=+++`);
  - `category`: an explicit category slug chosen in the clarifying card. It overrides the
    parser's category and subcategory;
  - `without`: repeated; chip kinds the user removed with ×;
  - `sort`: one of `MASTER_SORTS`, default `top_rated`.
- **`GET /masters` filters** (extends `MastersListQueryDTO`, offset/limit pagination stays
  as is):
  - `subcategory`: slug. It requires `category`, because subcategory slugs are only unique
    within a category. Without `category` → 400. Unknown slug → 404, via the existing
    `CategoryService.getSubcategoryBySlug`.
  - `priceMax`: integer in **cents**, `>= 1`. It goes to `findPage` as
    `priceMax: number | null` and becomes `AND o.price <= ${priceMax}` next to the
    category/subcategory conditions. So it affects eligibility and `minPrice` in the same way.
    Existing `findPage` callers (the category page) pass `null`.
- **`GET /masters` returns subcategories.** `MasterListCardResponse` gets
  `subcategories: SubcategoryResponse[]`, the same field `CategoryMasterCardResponse` already
  has. These are the subcategories of the master's active offerings, in subcategory
  `sortOrder`. `MasterService.getList` loads cards via the existing
  `findCategoryCardsByIds(ids, categoryId)` instead of `findCardsByIds`:
  - with `category`: only that category's subcategories, as on the category page;
  - without it: `categoryId` becomes `number | null` in `findCategoryCardsByIds` and
    `categoryMasterCardArgs`, and `null` means offerings of every category.
  No new repository method is needed. `/masters` in web ignores the extra field.
- **Parser endpoint** `GET /search/parse?q=&city=` in the existing `SearchController`:
  - `q`: required string, 1..300 chars.
  - `city`: required slug, same as `CityQueryDTO`. It is unused by the mock, but the future
    LLM version will want it.
  - Mock logic lives in `SearchService.parse`, with a `// Mock: replaced by an LLM later`
    comment:
    - lowercase `q`, then match category names/slugs and subcategory names from the DB, all
      loaded via a new `CategoryRepository.findAllSubcategories()` (bare models) plus the
      existing categories lookup;
    - a subcategory match also sets its category; the longest match wins;
    - price: regex for `under|up to|below|max|до` + optional `€` + number (`€35`, `35€`,
      `35 eur`) → `priceMax = n * 100`;
    - day words (`today`, `tomorrow`, `monday`..`sunday`, `weekend`) → a `day` chip;
    - `center|centre|old town` → an `area` chip.
    - No category or subcategory found → `{ status: "clarify", categories }`, with all
      categories in `sortOrder`.
- **Shared contract** (`responses/search.ts`):
  ```ts
  export type SearchChipKind = "category" | "subcategory" | "priceMax" | "day" | "area";
  export type SearchChipResponse = { kind: SearchChipKind; label: string };
  export type SearchFiltersResponse = { category?: string; subcategory?: string; priceMax?: number }; // priceMax in cents
  export type SearchParseResponse =
    | { status: "ok"; filters: SearchFiltersResponse; chips: SearchChipResponse[] }
    | { status: "clarify"; categories: CategoryResponse[] };
  ```
  `SEARCH_CHIP_KINDS` is a const array in `types/search.ts`, so web can validate `without`.
- **`day` and `area` chips are display-only.** The parser returns them, but no filter is sent
  to `/masters`, because the DB has no schedule and no distance-to-centre data. Removing them
  only removes the chip.
- **Chip removal** (×) links to the same `/search` URL with `without=<kind>` added. Removing
  `category` also drops `subcategory`, since `/masters` needs a category for a subcategory.
  If `category` is removed, the search runs across all categories, with no clarifying
  question.
- **Best match** is the first master of the current sort (offset 0). The grid shows the rest,
  and the heading reads "More masters (total − 1)". "Load more" reuses
  `MastersGrid`/`MasterListCard` and a `loadMore` server action with an offset that starts
  at 1 + page.
  - **Not shown:** time slots ("Sat 12:00"), because there is no data.
  - **Subtitle:** the master's subcategory names joined with ", " (e.g. "Gel, nail art"),
    from the new `subcategories` field of `GET /masters`. When the list is empty, fall back
    to the category names.
  - **Explanation:** built from a template on the web side, e.g.
    "Rated 4.9 from 128 reviews, Gel polish from €30." Parts with no data (no rating) are
    skipped.
  - **"View profile"** links to the master page if a route exists, otherwise `#` with a TODO.
- **Loading.** `/search` renders the search bar immediately. Results are in
  `<Suspense key={params} fallback={<SearchSkeleton/>}>`. The skeleton shows the
  "Understanding your request" line, chip pills, a Best match block and 4 card skeletons.
  The search bar button shows "Searching..." while the navigation is pending. Check the
  Next 16 docs for the right primitive (`useLinkStatus`/`useTransition` + `router.push`)
  before choosing.
- **Suggestions** come from the existing `GET /search/suggestions?locale=en&city=`. Each chip
  links to `/search?q=<text>`. A failure → no chips (as with `getCategories`).
- **Empty result** (`total === 0`): a short empty state ("No masters match all filters. Try
  removing one above.") under the chips.
- **Errors.** `parse` and `getMasters` errors propagate to `search/error.tsx`, the same as
  `masters/error.tsx`. A 404 on an unknown category from an explicit `category` param falls
  back to the parser result, as the masters page does.
- **Mobile, per the mockup.** Header chips are on one horizontally scrolling row. The search
  button goes full-width under the input. Best match stacks the photo above the content. The
  grid has 2 columns.

## Steps

1. ✅ **Shared contract.** Add `SEARCH_CHIP_KINDS`/`SearchChipKind` to `types/search.ts` and the
   response types to `responses/search.ts`, then export them from `index.ts`. Add
   `subcategories: SubcategoryResponse[]` to `MasterListCardResponse` in `responses/masters.ts`. Rebuild shared and
   check that `apps/masters` and `apps/web` compile.
2. ✅ **`GET /masters` filters.** Add `subcategory` and `priceMax` to `MastersListQueryDTO` (+ spec:
   subcategory without category, priceMax 0/negative/non-int), plus `MastersListQuery`. In the
   service, resolve the subcategory via `getSubcategoryBySlug`. Add `priceMax` to `findPage`
   params and SQL (pass `null` from `CategoryService.getMasters`). Make `categoryId` nullable
   in `findCategoryCardsByIds`/`categoryMasterCardArgs`, and use it in `getList` instead of
   `findCardsByIds`. Add `subcategories` in `MasterResponder.listResponse`. Update specs for
   the service, repository and controller. `npm test` and `npm run lint` must pass in `apps/masters`. Check manually with
   `curl "localhost:3003/masters?city=vilnius&category=nails&subcategory=<slug>&priceMax=3500"`.
3. ✅ **Parser endpoint.** Add `SearchParseQueryDTO` (+ spec) and
   `CategoryRepository.findAllSubcategories` (+ spec). Add `SearchService.parse` with the mock
   rules (+ spec covering the mockup query
   "Gel manicure with glitter, under €35, Saturday near the center", the clarify case
   "Something beautiful for tomorrow", and price formats). Add a `SearchResponder.parseResponse`
   and the controller route (+ spec). Tests and lint must pass. Check manually with curl.
4. ✅ **Web: API client + home hero.** Add `mastersApi.parseSearch`, `getSearchSuggestions`, and
   `subcategory`/`priceMax` in `MastersListParams`. Add a reusable `SearchBar` client component
   (sparkle icon, input `q`, submit button with pending label, mobile layout) and a `SearchHero`
   (title, subtitle, `SearchBar`, suggestion chips) at the top of `(main)/page.tsx`. Lint must
   pass. Compare with the home mockups (desktop + mobile).
5. ✅ **Web: `/search` page.** Add `page.tsx` that parses params, calls parse, resolves filters
   (`category` override, `without`), and renders either `ClarifyCard` or `SearchResults`.
   `SearchResults` includes the "We understood" chips with × links, `BestMatchCard`,
   "More masters (N)" + `SortSelect` + `MastersGrid` with the `loadMore` action, and the empty
   state. Add `error.tsx` and metadata. Lint must pass. Compare with the results and clarifying
   mockups.
6. ✅ **Web: loading state + responsive pass.** Add the `Suspense` boundary with `SearchSkeleton`.
   The "Searching..." button state is already built in `SearchBar` in step 4, so only check that
   it works. Also check the home page after the follow-up changes:
   - `.home` has no 840px cap any more, so sections are full width like the header;
   - the hero is capped at 760px;
   - the category heading reads "Or choose a category";
   - suggestion chips come from the DB, now that the migration and seed are applied.

   Check the project's target widths: 390px (phone), 768px (tablet), 1280px (desktop). The map
   must not turn into a thin strip at 1280px. Do a mobile pass on the hero, chips row, Best match and
   grid. Lint must pass. Open the pages at desktop and 390px widths and compare all four mockups.
