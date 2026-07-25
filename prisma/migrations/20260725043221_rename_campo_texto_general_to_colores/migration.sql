/*
  Warnings:

  - You are about to drop the column `campoNumero2` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `campoTexto1` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `campoTextoGeneral` on the `products` table. All the data in the column will be lost.
  - Added the required column `colores` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marca` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelo` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable

ALTER TABLE "products" RENAME COLUMN "campoTextoGeneral" TO "colores";