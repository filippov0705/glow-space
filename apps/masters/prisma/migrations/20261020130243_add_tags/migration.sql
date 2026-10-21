-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_tags" (
    "master_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "master_tags_pkey" PRIMARY KEY ("master_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_category_id_slug_key" ON "tags"("category_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_id_category_id_key" ON "tags"("id", "category_id");

-- CreateIndex
CREATE INDEX "master_tags_tag_id_idx" ON "master_tags"("tag_id");

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_tags" ADD CONSTRAINT "master_tags_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_tags" ADD CONSTRAINT "master_tags_master_id_category_id_fkey" FOREIGN KEY ("master_id", "category_id") REFERENCES "master_categories"("master_id", "category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_tags" ADD CONSTRAINT "master_tags_tag_id_category_id_fkey" FOREIGN KEY ("tag_id", "category_id") REFERENCES "tags"("id", "category_id") ON DELETE RESTRICT ON UPDATE CASCADE;
