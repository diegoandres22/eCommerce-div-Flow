-- AlterTable
ALTER TABLE "configuracion_tienda" ADD COLUMN     "bannerText" TEXT,
ADD COLUMN     "showBanner" BOOLEAN NOT NULL DEFAULT false;
