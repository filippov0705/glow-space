# Master reviews: database only

Scope: Prisma schema, migration and seed in `apps/masters`. No services, endpoints or UI.

## Key decisions

- A client can leave one review per master: `UNIQUE (master_id, client_user_uuid)`.
  The client can edit it at any time, so the table has `updated_at`.
- No link to `bookings`, because old bookings may be purged. The service checks
  "the client had a completed booking with this master" when the review is created.
- `offering_name` and `author_name` are copied into the review when it is created.
  When the user changes their name, the service updates `author_name` in all of
  their reviews by `client_user_uuid`. That column gets its own index for this.
- `rating` is `Int`, CHECK `rating BETWEEN 1 AND 5`.
- `text` is optional. Reviews without text count only toward the rating. Reviews
  with text are also shown in the list. CHECK: `text` is null or non-empty.
- The master's reply is stored in the same row as `reply_text` and `replied_at`:
  - both columns are null, or both are set;
  - a reply is allowed only when `text` is not null.
- `masters.rating` and `masters.reviews_count` already exist. `reviews_count`
  counts all reviews, including star-only ones. The future service keeps both
  up to date. No triggers.
- The star distribution is computed with `GROUP BY rating`. No counter columns.
- `master_id` → `masters.id` with `onDelete: Cascade`.
- Partial index `(master_id, created_at) WHERE text IS NOT NULL` for the review list
  on the master page.
- Prisma can't express the CHECKs or the partial index, so they are written by hand
  into a migration created with `--create-only`.

## Steps

1. [x] Schema and migration.
   - Add model `Review` (`reviews`) to `apps/masters/prisma/schema.prisma`:
     `id` (uuid), `masterId`, `clientUserUuid`, `authorName`, `offeringName`, `rating`,
     `text?`, `replyText?`, `repliedAt?`, `createdAt`, `updatedAt`.
     Add `@@unique([masterId, clientUserUuid])`, `@@index([clientUserUuid])`, and the
     back-relation `reviews` on `Master`.
   - Run `npx prisma migrate dev --create-only --name master_reviews`. Append the CHECKs
     and the partial index to `migration.sql`, then run `npx prisma migrate dev` and
     `npx prisma generate`.
   - Check in psql that each of these is rejected: `rating = 6`, `text = ''`, a reply
     without `replied_at`, a reply on a star-only review, and a second review from the
     same client for the same master.
   - Run `migrate dev` again and confirm it reports no drift.
   - Run `npm run lint` and `npm test` in `apps/masters`.

2. [ ] Mock reviews in seed.
   - Extend `apps/masters/prisma/seed.ts`, following its existing style and its way of
     staying idempotent.
   - Seed reviews for most masters. Vary the number per master and mix reviews with
     text and star-only ones. Give some text reviews a master reply. Generate them
     deterministically, not randomly.
   - Take `offering_name` from the master's real offerings. Use fake client uuids.
     Don't seed bookings.
   - Recompute `masters.rating` (average, rounded to one decimal) and
     `masters.reviews_count` (all reviews) from the seeded reviews.
   - Run `npx prisma db seed` twice. The second run must not fail or duplicate rows.
   - Run `npm run lint` in `apps/masters`.
