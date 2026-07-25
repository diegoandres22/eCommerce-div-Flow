-- AlterTable
ALTER TABLE "products" ADD COLUMN     "isOutOfStock" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");

-- CreateIndex
CREATE INDEX "products_isActive_idx" ON "products"("isActive");
