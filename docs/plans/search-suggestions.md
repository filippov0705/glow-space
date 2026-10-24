# Search suggestions

Groundwork for the AI-powered master search. The home page hero (see mockup) shows template
suggestion chips under the search input ("Gel manicure under €30", ...). This feature stores those
suggestions in the database and serves them from `GET /search/suggestions?locale=en&city=vilnius`.

Scope: backend only (`packages/shared` + `apps/masters`). The hero block in `apps/web` is built
later together with the search itself.

## Key decisions

- **Lives in `apps/masters`** (`masters_db`), next to the catalog and `cities`. New
  `SearchController` (`@Controller('search')`), `SearchService`, `SearchSuggestionRepository`,
  `SearchResponder`, registered in `app.module.ts`.
- **Model** (as requested, `citySlug` is a plain string, not a FK, consistent with "pass cities by slug"):
  ```prisma
  model SearchSuggestion {
    id        String   @id @default(uuid())
    text      String
    locale    String                       // "en", "ru", "lt"
    citySlug  String?  @map("city_slug")   // null = all cities
    sortOrder Int      @default(0) @map("sort_order")
    isActive  Boolean  @default(true) @map("is_active")

    @@index([locale, isActive])
    @@map("search_suggestions")
  }
  ```
- **Selection:** `locale = :locale AND isActive AND (citySlug = :city OR citySlug IS NULL)`,
  `ORDER BY sortOrder ASC`, `take: 6` (`SUGGESTIONS_LIMIT = 6` in the service). Fewer than 4 matching
  rows → return what exists; no padding.
- **Locale fallback:** if the result for the requested locale is empty and locale is not `en`,
  run the same query with `en`. The fallback lives in the service, the repository has one method.
- **Query DTO** (`SearchSuggestionsQueryDTO`): `locale` required, `@IsIn(SUGGESTION_LOCALES)`;
  `city` optional string (omitted → only global suggestions). Unknown city slug is not an error:
  it simply matches only global rows (no city lookup, no 404).
- **Shared:** `SUGGESTION_LOCALES = ["en", "ru", "lt"] as const` + `SuggestionLocale` type in
  `types/search.ts`; `SearchSuggestionResponse = { id: string; text: string }` in
  `responses/search.ts`. Endpoint returns `SearchSuggestionResponse[]`.
- **Seed:** 10 rows with fixed uuids, upserted by `id` (idempotent, same style as the rest of
  `seed.ts`). Composition:
  - en, global: the 4 chips from the mockup + 2 more (sortOrder 10..60);
  - en, `vilnius`: 2 rows (e.g. "Manicure in Old Town tomorrow morning"), interleaved by sortOrder;
  - en, global, `isActive: false`: 1 row (checks filtering);
  - ru, global: 1 row — so `locale=ru` returns it without fallback, `locale=lt` falls back to en.
  For `en`, Vilnius gets the first 6 of its 8 rows (city ones mixed in by sortOrder); any other
  city gets the 6 global rows.

## Steps

1. ✅ **Shared contract.** Add `types/search.ts` (`SUGGESTION_LOCALES`, `SuggestionLocale`) and
   `responses/search.ts` (`SearchSuggestionResponse`), export from `index.ts`. Rebuild shared and
   check `apps/masters` still compiles.
2. ✅ **Schema, migration, seed.** Add the model to `apps/masters/prisma/schema.prisma`, create the
   migration with `npx prisma migrate dev --name add_search_suggestions`, `npx prisma generate`,
   add the seed rows to `prisma/seed.ts`, run `npx prisma db seed`.
3. ✅ **Endpoint.** DTO + spec, repository (`findActive(locale, citySlug, limit)`, returns bare
   models) + spec, service with locale fallback + spec, responder, controller + spec, register in
   `app.module.ts`. `npm test` and `npm run lint` pass in `apps/masters`; manual check with
   `curl "localhost:3003/search/suggestions?locale=en&city=vilnius"`, `locale=lt`, `locale=xx` (400).
