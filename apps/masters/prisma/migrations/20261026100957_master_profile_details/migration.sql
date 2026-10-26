-- AlterTable
ALTER TABLE "masters" ADD COLUMN     "about" TEXT,
ADD COLUMN     "experience_years" INTEGER;

-- CreateTable
CREATE TABLE "languages" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_languages" (
    "master_id" INTEGER NOT NULL,
    "language_id" INTEGER NOT NULL,

    CONSTRAINT "master_languages_pkey" PRIMARY KEY ("master_id","language_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- AddForeignKey
ALTER TABLE "master_languages" ADD CONSTRAINT "master_languages_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_languages" ADD CONSTRAINT "master_languages_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written constraint that Prisma cannot express.
-- experience_years is optional, but a stored value cannot be negative.
ALTER TABLE "masters" ADD CONSTRAINT "masters_experience_years_check"
    CHECK ("experience_years" IS NULL OR "experience_years" >= 0);
