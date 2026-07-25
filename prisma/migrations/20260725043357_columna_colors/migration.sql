/*
  Warnings:

  - You are about to drop the column `campoNumero2` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `campoTexto1` on the `products` table. All the data in the column will be lost.
  - Added the required column `marca` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelo` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "campoNumero2",
DROP COLUMN "campoTexto1",
ADD COLUMN     "marca" TEXT NOT NULL,
ADD COLUMN     "modelo" TEXT NOT NULL;
