-- CreateTable
CREATE TABLE "cities" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "masters" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "city_id" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION,
    "reviews_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_categories" (
    "master_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "master_categories_pkey" PRIMARY KEY ("master_id","category_id")
);

-- CreateTable
CREATE TABLE "works" (
    "id" SERIAL NOT NULL,
    "master_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "masters_uuid_key" ON "masters"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "masters_user_uuid_key" ON "masters"("user_uuid");

-- CreateIndex
CREATE INDEX "masters_city_id_status_rating_idx" ON "masters"("city_id", "status", "rating");

-- CreateIndex
CREATE INDEX "works_master_id_sort_order_idx" ON "works"("master_id", "sort_order");

-- AddForeignKey
ALTER TABLE "masters" ADD CONSTRAINT "masters_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_categories" ADD CONSTRAINT "master_categories_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_categories" ADD CONSTRAINT "master_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "works" ADD CONSTRAINT "works_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "works" ADD CONSTRAINT "works_master_id_category_id_fkey" FOREIGN KEY ("master_id", "category_id") REFERENCES "master_categories"("master_id", "category_id") ON DELETE CASCADE ON UPDATE CASCADE;
