/*
  Warnings:

  - A unique constraint covering the columns `[productId,colorName,talla]` on the table `product_color_stock` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "product_color_stock_productId_colorName_key";

-- AlterTable
ALTER TABLE "product_color_stock" ADD COLUMN     "talla" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "colorName" SET DEFAULT '';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "tallas" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "product_color_stock_productId_colorName_talla_key" ON "product_color_stock"("productId", "colorName", "talla");
