-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "working_hours" (
    "id" SERIAL NOT NULL,
    "master_id" INTEGER NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,

    CONSTRAINT "working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_exceptions" (
    "id" SERIAL NOT NULL,
    "master_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "is_day_off" BOOLEAN NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,

    CONSTRAINT "schedule_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "master_id" INTEGER NOT NULL,
    "offering_id" TEXT NOT NULL,
    "client_user_uuid" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "offering_name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "working_hours_master_id_weekday_idx" ON "working_hours"("master_id", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_exceptions_master_id_date_key" ON "schedule_exceptions"("master_id", "date");

-- CreateIndex
CREATE INDEX "bookings_client_user_uuid_idx" ON "bookings"("client_user_uuid");

-- AddForeignKey
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Hand-written constraints that Prisma cannot express.
-- Times are the master's local wall-clock time; HH:MM strings compare correctly as text.

-- btree_gist lets the EXCLUDE constraint use "=" on an integer column.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- working_hours
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_weekday_check"
    CHECK ("weekday" BETWEEN 1 AND 7);
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_start_time_format_check"
    CHECK ("start_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_end_time_format_check"
    CHECK ("end_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_time_order_check"
    CHECK ("end_time" > "start_time");

-- schedule_exceptions
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_start_time_format_check"
    CHECK ("start_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_end_time_format_check"
    CHECK ("end_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_day_off_times_check"
    CHECK (
        ("is_day_off" AND "start_time" IS NULL AND "end_time" IS NULL)
        OR (NOT "is_day_off" AND "start_time" IS NOT NULL AND "end_time" IS NOT NULL AND "end_time" > "start_time")
    );

-- bookings
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_time_order_check"
    CHECK ("ends_at" > "starts_at");
-- A master cannot have two active (PENDING/CONFIRMED) bookings that overlap.
-- tsrange is half-open [start, end), so back-to-back bookings are allowed.
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap"
    EXCLUDE USING gist ("master_id" WITH =, tsrange("starts_at", "ends_at") WITH &&)
    WHERE ("status" IN ('PENDING', 'CONFIRMED'));
