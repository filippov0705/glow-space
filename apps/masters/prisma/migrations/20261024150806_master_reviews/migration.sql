-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "master_id" INTEGER NOT NULL,
    "client_user_uuid" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "offering_name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "reply_text" TEXT,
    "replied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_client_user_uuid_idx" ON "reviews"("client_user_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_master_id_client_user_uuid_key" ON "reviews"("master_id", "client_user_uuid");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written constraints and index that Prisma cannot express.

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_check"
    CHECK ("rating" BETWEEN 1 AND 5);
-- Star-only reviews have NULL text, never an empty string.
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_text_not_empty_check"
    CHECK ("text" IS NULL OR "text" <> '');
-- The master's reply: both columns null or both set.
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reply_pair_check"
    CHECK (("reply_text" IS NULL) = ("replied_at" IS NULL));
-- A reply is allowed only on a review with text.
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reply_requires_text_check"
    CHECK ("reply_text" IS NULL OR "text" IS NOT NULL);

-- Review list on the master page shows only reviews with text, newest first.
CREATE INDEX "reviews_master_id_created_at_with_text_idx"
    ON "reviews"("master_id", "created_at") WHERE "text" IS NOT NULL;
