# All categories page

Add a `/categories` page in `apps/web`. The "See all" link next to "Categories" on the home page
leads to it. The page shows every category with the number of masters in the current city, the
total number of masters in the city, and the category image, or a placeholder when it has no image.
Layout follows the mockup: breadcrumb "Home / Categories", the title "All categories", the subtitle
"12 categories and 1,100 masters in Vilnius", a search field on the right, and a 4-column grid of
tiles. Each tile has an "N masters" badge in the top right and the name at the bottom left.

This builds on the uncommitted `Category.imageUrl` work: the migration
`20261020085856_add_category_image_url`, `imageUrl` in `CategoryResponse`, and the image tiles in
`CategoriesSection`.

## Key decisions

- **Counts are per city, active masters only.** This matches "in Vilnius" in the mockup and the
  rest of the site, which is city-based. The city comes from `resolveCurrentCity()`, as on the home
  page. The total is the number of distinct active masters in the city. It is not the sum of the
  category counts, because a master can belong to several categories.
- **New endpoint, existing one unchanged.** `GET /categories/overview?city=<slug>` (reuses
  `CityQueryDTO`) returns `CategoriesOverviewResponse`:
  ```ts
  type CategoryWithCountResponse = CategoryResponse & {
    description: string | null;
    mastersCount: number;
  };
  type CategoriesOverviewResponse = {
    totalMasters: number;
    categories: CategoryWithCountResponse[];
  };
  ```
  `GET /categories` stays as it is for the home page. An unknown city slug returns 404 and is
  checked in the service the same way the master service does it.
- **Queries.** Add a new repository method, `CategoryRepository.findAllWithMastersCount(cityId)`,
  that uses `_count: { select: { masters: { where: { master: { cityId, status: ACTIVE } } } } }`
  ordered by `sortOrder`. Categories with 0 masters are still returned. Add a new method,
  `MasterRepository.countActiveByCity(cityId)`, implemented as `master.count`. Existing methods stay
  unchanged.
- **Image or placeholder.** When `imageUrl` is set, the image covers the tile (plain `<img>` with the
  eslint-disable comment, as in `CategoriesSection`). A dark gradient at the bottom keeps the name
  and the badge readable. When `imageUrl` is null, the tile uses the mockup placeholder: a solid
  background that alternates pink `#f6e1e8` and beige `#efe7e0`.
- **Search** filters the loaded categories by name on the client and makes no request. The grid is
  a small `"use client"` component that receives the data from the server page. When nothing
  matches, it shows "No categories found".
- **Category description.** Add a nullable column `Category.description String?`
  (`@map("description")`) through a new migration created with `migrate dev`. Fill it in the seed
  for every category, in the style of the mockup: "Manicure, pedicure, nail art", "Cuts, coloring,
  styling", and so on. Only the overview contract carries it (`CategoryWithCountResponse`).
  `CategoryResponse` and the master cards stay unchanged. On the tile, the description is a small
  line under the name, and it is hidden when the value is null.
- **Text.** Use "1 master" and "N masters" (singular for 1, plural otherwise), and format numbers
  with `toLocaleString("en-US")` (1,100). The subtitle is "N categories and M masters in <city
  name>".
- **Errors.** The web API client catches errors, logs them and returns
  `{ totalMasters: 0, categories: [] }`. The page then shows "No categories available yet.", like
  the home section does.

## Steps

1. [x] **Category description in the DB.** In `apps/masters`, add `description String?` to
   `Category`, create a new migration with `npx prisma migrate dev --name add_category_description`
   (don't edit existing migrations), run `prisma generate`, add descriptions to every category in
   `prisma/seed.ts`, and run `npx prisma db seed`. Lint and the existing tests pass.
2. [x] **Shared contract.** Add `CategoryWithCountResponse` and `CategoriesOverviewResponse` to
   `packages/shared/src/responses/masters.ts`, export them, rebuild shared, and check that masters
   and web still compile.
3. [x] **Masters endpoint.** Add `GET /categories/overview?city=` (controller, service, the new
   repository methods above, and a `categoriesOverviewResponse` in `CategoryResponder`). Resolve the
   city by slug, and return 404 when it is unknown. Add or extend `category.controller.spec.ts` and
   add `category.service.spec.ts` that covers the counts and the unknown city. Lint and tests pass.
4. [x] **Web API client and "See all" link.** Add `getCategoriesOverview(citySlug)` to
   `apps/web/lib/api/masters.ts`. In `CategoriesSection`, put a "See all" link to `/categories` in
   the section header, on the right of the title, styled like any existing "See all" or section
   links on the home page, or in the accent color if there are none.
5. [x] **Categories page.** Add `apps/web/app/(main)/categories/page.tsx` (server component:
   resolve the city, fetch the overview) and a client component
   `components/CategoriesCatalog/` (search plus grid). Build the breadcrumb, title, subtitle, search,
   4-column grid (2 columns on mobile), tiles with the count badge, the description line, and the image or placeholder.
   Lint, then open the page and compare it with the mockup.
