-- DropForeignKey
ALTER TABLE "master_tags" DROP CONSTRAINT "master_tags_master_id_category_id_fkey";

-- DropForeignKey
ALTER TABLE "master_tags" DROP CONSTRAINT "master_tags_master_id_fkey";

-- DropForeignKey
ALTER TABLE "master_tags" DROP CONSTRAINT "master_tags_tag_id_category_id_fkey";

-- DropTable
DROP TABLE "master_tags";

-- RenameTable (keeps existing rows and ids)
ALTER TABLE "tags" RENAME TO "subcategories";

-- RenameSequence
ALTER SEQUENCE "tags_id_seq" RENAME TO "subcategories_id_seq";

-- RenamePrimaryKey
ALTER TABLE "subcategories" RENAME CONSTRAINT "tags_pkey" TO "subcategories_pkey";

-- RenameIndex
ALTER INDEX "tags_category_id_slug_key" RENAME TO "subcategories_category_id_slug_key";

-- RenameIndex
ALTER INDEX "tags_id_category_id_key" RENAME TO "subcategories_id_category_id_key";

-- RenameForeignKey
ALTER TABLE "subcategories" RENAME CONSTRAINT "tags_category_id_fkey" TO "subcategories_category_id_fkey";

-- CreateTable
CREATE TABLE "offerings" (
    "id" TEXT NOT NULL,
    "master_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "subcategory_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "duration_min" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offerings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "offerings_master_id_idx" ON "offerings"("master_id");

-- CreateIndex
CREATE INDEX "offerings_subcategory_id_idx" ON "offerings"("subcategory_id");

-- AddForeignKey
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_master_id_category_id_fkey" FOREIGN KEY ("master_id", "category_id") REFERENCES "master_categories"("master_id", "category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_subcategory_id_category_id_fkey" FOREIGN KEY ("subcategory_id", "category_id") REFERENCES "subcategories"("id", "category_id") ON DELETE RESTRICT ON UPDATE CASCADE;
