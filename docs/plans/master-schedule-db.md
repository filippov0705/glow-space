# Master schedule and bookings: database only

Scope: Prisma schema and migration in `apps/masters`. No services, endpoints or UI.

## Key decisions

- `masterId` is `Int` with a relation to `Master`, `onDelete: Cascade`.
- All times are the master's local wall-clock time. No timezone column.
  - `working_hours` and `schedule_exceptions`: `start_time` / `end_time` as `String` in `HH:MM` format.
  - `bookings`: `starts_at` / `ends_at` as `timestamp(3)` without timezone, and the overlap constraint uses `tsrange` (not `tstzrange`).
- `weekday` uses ISO numbering: 1 = Monday … 7 = Sunday.
- Shifts do not cross midnight: `end_time > start_time`.
- `schedule_exceptions` allows one row per master per date, so a special day has a single interval with no break.
- Booking status is a Postgres enum `BookingStatus`: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`.
- A booking stores a snapshot of the offering's name, price and currency at booking time.
- `bookings.offering_id` → `offerings.id` with `onDelete: Restrict`, so booking history is not lost.
- Constraints Prisma cannot express are added by hand to a new migration created with `--create-only`:
  - `CREATE EXTENSION IF NOT EXISTS btree_gist`
  - `EXCLUDE USING gist (master_id WITH =, tsrange(starts_at, ends_at) WITH &&) WHERE (status IN ('PENDING','CONFIRMED'))`
  - CHECK `weekday BETWEEN 1 AND 7`
  - CHECK `HH:MM` format on all time columns, and `end_time > start_time`
  - CHECK on `schedule_exceptions`: if `is_day_off` then both times are null, otherwise both are set and `end_time > start_time`
  - CHECK `ends_at > starts_at` on `bookings`

## Steps

1. [x] Schema and migration.
   - Add `WorkingHours`, `ScheduleException`, `Booking` and enum `BookingStatus` to `apps/masters/prisma/schema.prisma`, with back-relations on `Master` and `Offering`.
   - Booking fields: `id` (uuid), `masterId`, `offeringId`, `clientUserUuid`, `startsAt`, `endsAt`, `status` (default `CONFIRMED`), `offeringName`, `price`, `currency`, `createdAt`, `updatedAt`. Index on `clientUserUuid`.
   - Run `npx prisma migrate dev --create-only --name master_schedule_and_bookings`, append the hand-written SQL above to the generated `migration.sql`, then run `npx prisma migrate dev` and `npx prisma generate`.
   - Verify in psql that the EXCLUDE constraint rejects an overlapping `CONFIRMED` booking, accepts an adjacent one (`[10:00,11:00)` and `[11:00,12:00)`), and ignores `CANCELLED` rows.
   - Check that a second `migrate dev` reports no drift.
   - `npm run lint` and `npm test` in `apps/masters`.

2. [x] Mock schedule in seed.
   - Extend `apps/masters/prisma/seed.ts`, following its existing style and idempotency approach.
   - `working_hours` for every seeded master, varied so the data looks real:
     - most masters: Mon–Fri 10:00–14:00 and 15:00–19:00 (lunch break);
     - some masters: Tue–Sat 09:00–18:00 without a break;
     - a few masters also work Sunday 11:00–16:00.
     Pick the pattern deterministically from the master's position, not randomly.
   - `schedule_exceptions` for a few masters, with dates relative to the seed run date:
     - a day off;
     - a short day (10:00–14:00);
     - an extra working day on a normally free weekday.
   - No bookings in the seed.
   - Run `npx prisma db seed` twice and confirm that the second run neither fails nor duplicates rows.
   - `npm run lint` in `apps/masters`.
