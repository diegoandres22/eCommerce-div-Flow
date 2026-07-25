-- CreateTable
CREATE TABLE "broken_links" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broken_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "broken_links_path_key" ON "broken_links"("path");

-- CreateIndex
CREATE INDEX "broken_links_hits_idx" ON "broken_links"("hits");
