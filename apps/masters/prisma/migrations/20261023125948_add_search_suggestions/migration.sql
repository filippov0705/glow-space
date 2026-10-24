-- CreateTable
CREATE TABLE "search_suggestions" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "city_slug" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "search_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_suggestions_locale_is_active_idx" ON "search_suggestions"("locale", "is_active");
