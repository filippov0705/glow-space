# Subcategories and offerings

Rename `Tag` to `Subcategory` in `apps/masters`, add an `Offering` table for the services a master
offers, and drop `MasterTag`. A master's subcategories are no longer stored directly: they are the
subcategories of the master's offerings.

Today tags are used only in `apps/masters/prisma/schema.prisma` and `apps/masters/prisma/seed.ts`.
No API, contract in `@glow-space/shared` or web code reads them, so only `apps/masters` changes.

## Key decisions

- **Rename, don't recreate.** Model `Tag` → `Subcategory`, table `tags` → `subcategories`,
  `Category.tags` → `Category.subcategories`. The migration is created with
  `npx prisma migrate dev --create-only --name subcategories_and_offerings`, and its SQL (the new,
  unapplied migration only) is edited to use `ALTER TABLE ... RENAME` for the table, its primary key,
  unique indexes and foreign key, so existing rows and ids survive. Then it is applied with
  `npx prisma migrate dev`. Existing migrations are not touched.
- **`MasterTag` is dropped** (table `master_tags`, relations on `Master` and `MasterCategory`).
- **Offering ids follow the existing schema.** `Master.id` and `Tag.id` are `Int`, so
  `masterId` and `subcategoryId` are `Int`, not `String` as in the request. `id` stays
  `String @id @default(uuid())`.
- **Offering also stores `categoryId`** (not in the requested structure). It enables the same
  composite foreign keys `MasterTag` and `Work` use: `(masterId, categoryId)` → `master_categories`
  and `(subcategoryId, categoryId)` → `subcategories(id, category_id)`. The database then guarantees
  an offering's subcategory belongs to one of the master's categories.
- **Model:**
  ```prisma
  model Offering {
    id            String   @id @default(uuid())
    masterId      Int      @map("master_id")
    categoryId    Int      @map("category_id")
    subcategoryId Int      @map("subcategory_id")
    name          String
    price         Int      // in cents
    currency      String   @default("EUR")
    durationMin   Int      @map("duration_min")
    isActive      Boolean  @default(true) @map("is_active")
    createdAt     DateTime @default(now()) @map("created_at")
    updatedAt     DateTime @updatedAt @map("updated_at")

    master         Master         @relation(fields: [masterId], references: [id], onDelete: Cascade)
    masterCategory MasterCategory @relation(fields: [masterId, categoryId], references: [masterId, categoryId], onDelete: Cascade)
    subcategory    Subcategory    @relation(fields: [subcategoryId, categoryId], references: [id, categoryId])

    @@index([masterId])
    @@index([subcategoryId])
    @@map("offerings")
  }
  ```
  `createdAt`/`updatedAt` are added to match `Master`.
- **A master's subcategories** = distinct subcategories of the master's offerings with
  `isActive = true`. No endpoint reads them yet, so no repository method is added in this plan.

## Steps

1. ✅ **Done.** **Schema and migration.** In `apps/masters/prisma/schema.prisma`: rename `Tag` → `Subcategory`
   (with `@@map("subcategories")` and the renamed relations), remove `MasterTag`, add `Offering`
   with relations on `Master`, `MasterCategory` and `Subcategory`. Create the migration with
   `--create-only`, edit its SQL to rename instead of drop/create, apply it, run
   `npx prisma generate`. Make sure `npm run build` in `apps/masters` still compiles (the seed may
   be broken until step 2; don't fix it here).
2. ✅ **Done.** **Seed.** In `apps/masters/prisma/seed.ts`: rename `tags` → `subcategories` in category data
   and in code (`prisma.subcategory.upsert`, `categoryId_slug`). Replace each master's tag slugs
   with a list of offerings (`subcategory` slug, `name`, `price` in cents, `durationMin`) with
   realistic EUR prices and durations, covering the same subcategories the master had as tags.
   On re-seed, delete the master's offerings before `works`/`master_categories`, then create them,
   resolving slugs only within the master's own categories. Run `npx prisma db seed` and check that
   it succeeds twice in a row. `npm run lint` and `npm test` pass in `apps/masters`.
