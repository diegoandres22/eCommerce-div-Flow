-- CreateTable
CREATE TABLE "page_visits" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "page_visits_path_key" ON "page_visits"("path");

-- CreateIndex
CREATE INDEX "page_visits_hits_idx" ON "page_visits"("hits");

-- CreateIndex
CREATE INDEX "page_visits_lastSeenAt_idx" ON "page_visits"("lastSeenAt");

-- CreateIndex
CREATE INDEX "broken_links_lastSeenAt_idx" ON "broken_links"("lastSeenAt");
