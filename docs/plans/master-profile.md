# Master profile

Public page `/masters/[uuid]` for one master: header, portfolio, about, services, reviews,
location, and a booking card. Mockups:

- Desktop: `/home/maksim/.cursor/projects/home-maksim-work-master-page/assets/Master_profile_2x-61dc870c-04a7-45a3-b2b4-85a022ab93e9.png`
- Mobile (390px): `/home/maksim/.cursor/projects/home-maksim-work-master-page/assets/Master_profile__mobile_390_2x-261d0a85-220e-4c49-9de6-78951d8176a9.png`

The page uses the existing `(main)` header and footer. Content comes from `apps/masters`.
The mock is the layout; names, prices and counts come from the database.

Out of scope: the studio pill, Verified, Top rated, cancellation copy, the reviews index
page, the photo gallery, the booking flow, and an admin UI. "All N photos", "Show all N
reviews", every "Book" button and the slot chips are visible and do nothing.

Touches `apps/masters`, `packages/shared` and `apps/web`.

## Key decisions

- **New master fields.** `about` (`String?`, text) and `experienceYears` (`Int?`).
  A check constraint: `experience_years` is null or `>= 0`. Prisma cannot express it, so
  it is appended by hand to a migration created with `--create-only`. Do not edit old
  migrations.
- **Languages.** Catalog table `languages` (`code` unique, `name`, `sortOrder`) and
  `master_languages` (`masterId`, `languageId`, composite id, cascade delete). Seed
  English, Russian and Lithuanian only. The pill joins names in `sortOrder` with ` · `.
  No languages, no pill. `experienceYears === null`, no experience pill. No about text,
  no languages and no experience: the About section is omitted.
- **Portfolio.** Seed `WORKS_PER_CATEGORY = 8`. The page shows the first 6 by `sortOrder`.
  The link reads `All {worksCount} photos` and is a `<button type="button">`. No works:
  no Portfolio section.
- **Specialization.** Not a stored string. The response carries the master's categories
  (category `sortOrder`) and the distinct subcategories of active offerings (subcategory
  `sortOrder`). The web renders `{categories joined by ", "} · {subcategories joined by ", "}`.
  Omit the ` · ` part when there are no subcategories. Omit the line when there are no
  categories.
- **Reviews on the page.** Distribution counts every review, including star-only, always
  five rows from 5 down to 1. The cards are the 3 newest reviews that have text. Desktop
  shows all 3; under 1024px CSS hides the third. Dates are relative (`2 weeks ago`),
  computed on the web from `createdAt`. "Show all {reviewsCount} reviews" uses the total
  count, including star-only, and is a button that does nothing. `reviewsCount === 0`:
  the section stays, with an empty summary, no cards and no button. The header then
  shows "New" and does not link to the section.
- **Header rating.** When `reviewsCount > 0`, the rating and the review count are links
  to `#reviews`.
- **Address.** The same `address` string in the header and in Location.
- **Price.** `from` is the cheapest active offering (price in cents plus its currency).
  No active offerings: no Services section, no booking card, no mobile bar.
- **Slots.** Three next free starts, 30-minute step, looked up at most 14 days ahead.
  A start is free when the half-open range `[start, start + 30min)` lies inside a
  working interval and does not overlap a `PENDING` or `CONFIRMED` booking. An exception
  replaces that date's weekly hours (day off, or one special interval). "Now" is
  `Europe/Vilnius` wall time. There is no timezone column; Vilnius and Riga share that
  zone. Do not add a date library: use `Intl.DateTimeFormat` with `timeZone: "Europe/Vilnius"`.
  The first candidate is the next 30-minute mark strictly after now. The API returns
  `startsAt` as a local ISO string with no offset (`2026-10-31T14:00:00`). The web
  formats weekday and time from those parts. It must not parse the string with
  `new Date`, which would apply another zone.
- **Booking UI.** Desktop (`≥ 1024px`): sticky card beside the sections below the
  header, with `from`, up to three slot chips, and "Book appointment". No cancellation
  line. Below 1024px: the card is hidden and a fixed bottom bar shows the price and
  "Book". The page gets bottom padding so the bar does not cover Location. Buttons and
  chips have no handler. No slots: the card and the bar still show the price and the
  button, without chips.
- **Booking module.** Schedule and bookings live in `BookingModule`
  (`src/booking.module.ts`) inside `apps/masters`, same database. Files keep the
  layered layout: `repository/booking.repository.ts`, `services/booking.service.ts`,
  `utils/next-slots.ts`. The module exports only `BookingService`; `MasterService`
  gets slots through it. `MasterRepository` does not load working hours, exceptions or
  bookings. Category, master and search stay in `AppModule`.
- **Prisma module.** `PrismaService` moves into a `@Global()` `PrismaModule`
  (`prisma/prisma.module.ts`) that exports it. No module lists `PrismaService` in its
  own `providers`, so there is one instance and one connection pool.
- **Who can be opened.** `status !== ACTIVE`, an unknown uuid, or a uuid that is not a
  uuid: 404. The web calls `notFound()` on 404 and lets other errors reach the masters
  error boundary.
- **Entry points.** `MasterListCard` (the `/masters` grid, the category grid, and search
  "more masters") and `BestMatchCard` link to `/masters/{uuid}`. The map card already
  does. Home "top masters" cards stay as they are.
- **Avatar.** `photoUrl` when set. Otherwise a circle with up to two initials from the
  name.

## Steps

1. [x] **Schema and migration.** In `apps/masters/prisma/schema.prisma`, add `about` and
   `experienceYears` on `Master`, plus `Language` and `MasterLanguage` with a
   back-relation. Run `npx prisma migrate dev --create-only --name master_profile_details`
   in `apps/masters`, append the experience check, then `npx prisma migrate dev` and
   `npx prisma generate`. Run `npm run lint` and `npm test` in `apps/masters`.

2. [x] **Seed.** Extend `apps/masters/prisma/seed.ts` in its existing idempotent style.
   - Upsert the three languages.
   - Give the first master (Anna K.) `experienceYears: 7`, all three languages, and an
     about paragraph. Vary the rest by master index: some null experience, some with no
     languages, some with a null about.
   - Set `WORKS_PER_CATEGORY` to 8.
   - Replace `master_languages` inside the per-master loop the same way works are replaced.
   - Do not change review generation.
   - Run `npx prisma db seed` in `apps/masters` twice. The second run must not fail or
     duplicate rows. Run `npm run lint` in `apps/masters`.

3. [x] **Shared contract.** Add `MasterProfileResponse` to
   `packages/shared/src/responses/masters.ts` and export it from `index.ts`. Rebuild
   shared (`npm run build` in `packages/shared`).

   ```ts
   export type MasterProfileResponse = {
     uuid: string;
     name: string;
     photoUrl: string | null;
     address: string;
     lat: number;
     lng: number;
     categories: { slug: string; name: string }[];
     subcategories: { slug: string; name: string }[];
     rating: number | null;
     reviewsCount: number;
     about: string | null;
     experienceYears: number | null;
     languages: { code: string; name: string }[];
     works: { imageUrl: string }[]; // at most 6, sortOrder
     worksCount: number;
     offerings: {
       id: string;
       name: string;
       durationMin: number;
       price: number; // cents
       currency: string;
     }[];
     minPrice: number | null; // cents of the cheapest active offering
     currency: string | null;
     // Always 5 rows, 5 down to 1, star-only reviews included
     ratingDistribution: { rating: number; count: number }[];
     reviews: {
       id: string;
       authorName: string;
       offeringName: string;
       rating: number;
       text: string;
       createdAt: string; // ISO
       replyText: string | null;
     }[]; // at most 3, newest with text
     // Local wall time, no offset. Format from the string parts.
     nextSlots: { startsAt: string }[];
   };
   ```

4. [x] **Next slots.** Add a pure function in `apps/masters/src/utils/next-slots.ts` and
   `next-slots.spec.ts`. Inputs: `now` (a `Date`), weekly hours, exceptions, and
   bookings (`startsAt`, `endsAt`, `status`). Output: up to three `startsAt` strings as
   in the key decisions. Cover a lunch gap, a day off, a special interval, an overlapping
   pending or confirmed booking, a cancelled booking that does not block, a start exactly
   on a 30-minute mark, fewer than three slots, and none within 14 days. Run `npm test`
   and `npm run lint` in `apps/masters`.

5. [x] **Prisma and booking modules.**
   - Add `apps/masters/prisma/prisma.module.ts`: `@Global()`, provides and exports
     `PrismaService`. `AppModule` imports it and drops `PrismaService` from `providers`.
   - Add `src/booking.module.ts` with `BookingRepository` and `BookingService`,
     exporting `BookingService`. `AppModule` imports it.
   - `BookingRepository`: one method per table for a master: weekly hours, exceptions
     in the 14-day window, and `PENDING`/`CONFIRMED` bookings in that window. Bare
     models, no `include`.
   - `BookingService.getNextSlots(masterId, now)` loads those and calls the step 4
     function.
   - `booking.service.spec.ts` with constructor mocks. Run `npm run lint` and `npm test`
     in `apps/masters`, and start the app once to check that DI resolves.

6. [x] **`GET /masters/:uuid`.** Follow `.claude/skills/nest-endpoint/SKILL.md`.
   - New repository method only. Do not add `include` to existing methods. Load the
     master, categories, active offerings with subcategory, the first 6 works plus the
     work count, languages, the rating distribution, and the 3 newest text reviews.
     No schedule or bookings here.
   - `MasterService` throws `NotFoundException` when the uuid is missing, malformed, or
     the master is not `MasterStatus.ACTIVE`. Slots come from
     `BookingService.getNextSlots`, called only after the status check.
     `minPrice` is the cheapest active offering.
   - Responder returns `MasterProfileResponse`. Controller: `@Get(':uuid')` after the
     static `top` and `map` routes.
   - Specs for the service and the controller, built with constructor mocks, no testing
     module. Run `npm run lint` and `npm test` in `apps/masters`.

7. [x] **Web: page, header, portfolio, about.** Read the Next.js guide in
   `apps/web/node_modules/next/dist/docs/` before writing the page. Route
   `app/(main)/masters/[uuid]/page.tsx`, with `generateMetadata` (`{name} · GlowSpace`).
   Add `getMasterProfile` to `lib/api/masters.ts`: 404 returns null, other errors throw.
   - Breadcrumb: Home (`/`), Masters (`/masters`), name.
   - Header: avatar or initials, name, specialization, rating link or "New", address.
   - Portfolio and About, including the empty cases from the key decisions.
   - SCSS modules, double quotes, same BEM style as the other pages.
   - Run `npm run lint` and `npx tsc --noEmit` in `apps/web`.

8. [x] **Web: services, reviews, location.**
   - Services: active offerings in the response order. Each row is name, `{durationMin} min`,
     and `formatPrice`. "Book" only at `≥ 1024px`, a button with no handler.
   - Reviews: summary (average, stars, `{reviewsCount} reviews`), distribution bars,
     cards (name, relative date, offering, stars, text, reply when `replyText` is set),
     and the "Show all" button. Section id `reviews`.
   - Location: the address and a single-pin Leaflet map (react-leaflet, one marker, no
     popup, pink pin like the home map, about 200px tall). Do not reuse `MastersMap`;
     that map loads every master in the city. Check Leaflet's CSS before styling inside
     the map.
   - Run `npm run lint` and `npx tsc --noEmit` in `apps/web`.

9. [x] **Web: booking card, mobile bar, entry points.**
   - Sticky card at `≥ 1024px` and the fixed bottom bar below that, as in the key decisions.
     Slot chips are buttons with no handler. Format `startsAt` from its string parts as
     `Sat 14:00`.
   - Link `MasterListCard` and `BestMatchCard` to `/masters/{uuid}`.
   - Run `npm run lint`, `npx tsc --noEmit` and `npm run build` in `apps/web`.
   - Open the page for a seeded master and compare it with both mockups at 1440px and
     390px. Also check 768px: one column, bottom bar, no sticky card, two review cards.
