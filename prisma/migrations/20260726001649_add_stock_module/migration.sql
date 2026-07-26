-- CreateEnum
CREATE TYPE "LeadEstado" AS ENUM ('pendiente', 'confirmado', 'cancelado');

-- AlterTable
ALTER TABLE "configuracion_tienda" ADD COLUMN     "controlStockActivo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "estado" "LeadEstado" NOT NULL DEFAULT 'pendiente';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockMinimo" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "product_color_stock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_color_stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_color_stock_productId_colorName_key" ON "product_color_stock"("productId", "colorName");

-- CreateIndex
CREATE INDEX "leads_estado_idx" ON "leads"("estado");

-- AddForeignKey
ALTER TABLE "product_color_stock" ADD CONSTRAINT "product_color_stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
