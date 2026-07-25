// File: server/queries/settings.ts
import prisma from '@/lib/prisma';

export async function getWhatsappNumber() {
  const config = await prisma.configuracionTienda.findFirst();
  return config?.whatsappNumber ?? null;
}

export async function getStoreBanner() {
  const config = await prisma.configuracionTienda.findFirst();
  return {
    bannerText: config?.bannerText ?? null,
    showBanner: config?.showBanner ?? false,
  };
}
